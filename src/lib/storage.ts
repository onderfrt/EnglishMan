import type { Goal, Level, Word } from '../data/words';
import type { CardState } from './srs';

export interface Settings {
  /** Öğrenme hedefi. null: henüz seçilmedi (hedef seçim ekranı gösterilir). */
  goal: Goal | null;
  /** Sınav tarihi (YYYY-MM-DD), sınav hedeflerinde isteğe bağlı. */
  examDate: string | null;
  /** Genel İngilizce'de yeni kelimelerin seçildiği seviye. null: henüz seçilmedi (seviye seçim ekranı gösterilir). */
  level: Level | null;
  newPerDay: number;
  maxReviewsPerSession: number;
  autoSpeak: boolean;
  /** Seçilen İngilizce ses (null: otomatik). */
  voiceURI: string | null;
  /** Görünüm: telefonun temasını izle ya da açık/koyu sabitle. */
  theme: Theme;
}

export type Theme = 'system' | 'light' | 'dark';

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
  /** Notun son değiştirilme (ya da silinme) zamanı; eşitlemede yeni olan kazanır. */
  noteAt: Record<string, number>;
  /** Favori kelimeler (♡): açık/kapalı ve son değiştirilme zamanı. */
  favorites: Record<string, { on: boolean; at: number }>;
  /**
   * Kullanıcının "öğrendim" diye işaretlediği kendi kelimeleri (Öğrendiklerim). Bu kelimeler günlük tekrarlara ve
   * yeni kelimelere girmez; istendiğinde sınavla yoklanır. İşaret kaldırılınca kelime öğrenme akışına geri döner.
   */
  known: Record<string, { on: boolean; at: number }>;
  /** Kullanıcının kendi eklediği kelimeler. */
  customWords: Word[];
  /** Silinen kendi kelimeler: kimlik → silinme zamanı. Eşitlemede başka cihazdan geri gelmesinler diye. */
  deleted: Record<string, number>;
  settings: Settings;
  /** Ayarların son değiştirilme zamanı (eşitlemede yeni olan kazanır). */
  settingsUpdatedAt: number;
  /** Anahtar: YYYY-MM-DD (yerel tarih). */
  days: Record<string, DayLog>;
}

const KEY = 'englishman:progress:v1';

export const DEFAULT_SETTINGS: Settings = {
  goal: null,
  examDate: null,
  level: null,
  newPerDay: 10,
  maxReviewsPerSession: 40,
  autoSpeak: true,
  voiceURI: null,
  theme: 'system',
};

export function emptyProgress(): Progress {
  return {
    version: 1,
    cards: {},
    notes: {},
    noteAt: {},
    favorites: {},
    known: {},
    customWords: [],
    deleted: {},
    settings: { ...DEFAULT_SETTINGS },
    settingsUpdatedAt: 0,
    days: {},
  };
}

/** Kelime kullanıcı tarafından "öğrendim" diye işaretlendi mi? */
export function isKnown(p: Progress, wordId: string): boolean {
  return !!p.known?.[wordId]?.on;
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

/** Sınava kalan gün sayısı (bugün sınav günüyse 0). Tarih yoksa ya da geçtiyse null. */
export function daysUntil(date: string | null, now: number): number | null {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return days >= 0 ? days : null;
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
