import type { Level } from '../data/words';
import type { CardState } from './srs';

export interface Settings {
  /** Yeni kelimelerin seçildiği seviye. null: henüz seçilmedi (seviye seçim ekranı gösterilir). */
  level: Level | null;
  newPerDay: number;
  maxReviewsPerSession: number;
  autoSpeak: boolean;
  /** Seçilen İngilizce ses (null: otomatik). */
  voiceURI: string | null;
}

export interface DayLog {
  /** Bugün yapılan toplam tekrar sayısı. */
  reviews: number;
  correct: number;
  newLearned: number;
}

export interface Progress {
  version: 1;
  cards: Record<string, CardState>;
  /** Kullanıcının kelime için yazdığı kendi çağrışımı / hafıza ipucu. */
  notes: Record<string, string>;
  settings: Settings;
  /** Anahtar: YYYY-MM-DD (yerel tarih). */
  days: Record<string, DayLog>;
}

const KEY = 'englishman:progress:v1';

export const DEFAULT_SETTINGS: Settings = { level: null, newPerDay: 10, maxReviewsPerSession: 40, autoSpeak: true, voiceURI: null };

export function emptyProgress(): Progress {
  return { version: 1, cards: {}, notes: {}, settings: { ...DEFAULT_SETTINGS }, days: {} };
}

export function parseProgress(raw: string): Progress {
  const data = JSON.parse(raw) as Partial<Progress>;
  if (data.version !== 1 || typeof data.cards !== 'object') throw new Error('Geçersiz yedek dosyası');
  return {
    ...emptyProgress(),
    ...data,
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
  } as Progress;
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseProgress(raw) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Depolama kapalı ya da dolu: ilerleme yalnızca bu oturumda kalır.
  }
}

export function dayKey(time: number): string {
  const d = new Date(time);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Bugün (ya da henüz bugün çalışılmadıysa dünden geriye) üst üste çalışılan gün sayısı. */
export function streak(days: Record<string, DayLog>, now: number): number {
  // Gün gün geriye gitmek için takvim aritmetiği (yaz saati geçişlerinde de doğru çalışır).
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  if (!days[dayKey(d.getTime())]?.reviews) d.setDate(d.getDate() - 1);
  let count = 0;
  while (days[dayKey(d.getTime())]?.reviews) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
