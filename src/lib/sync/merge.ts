import type { Word } from '../../data/words';
import type { ImageState } from '../images';
import type { CardState } from '../srs';
import type { DayLog, Progress } from '../storage';

/**
 * İki cihazın verisini birleştirir. "Son kaydeden kazanır" yerine parça parça birleştirme yapılır ki
 * telefonda yapılan çalışma bilgisayardaki eski veriyle ezilmesin:
 * - Kelime tekrar kayıtları: en son çalışılan kazanır.
 * - Kendi kelimeler: en son düzenlenen kazanır; silinenler (deleted) geri gelmez.
 * - Notlar (hafıza ipuçları), favoriler ve "öğrendim" işaretleri: kelime başına en son değişiklik kazanır (silme dahil);
 *   zamanı bilinmeyen eski notlarda bu cihazdaki not kalır.
 * - Günlük istatistik: her alanın büyüğü (aynı gün iki cihazda çalışılırsa kayıp olmaz).
 * - Ayarlar: en son değiştirilen kazanır.
 * Birleştirme simetriktir ve tekrar uygulanabilir: merge(merge(a, b), b) = merge(a, b).
 */
export function mergeProgress(local: Progress, remote: Progress | null | undefined): Progress {
  if (!remote) return local;

  const deleted = mergeRecords(local.deleted ?? {}, remote.deleted ?? {}, (a, b) => Math.max(a, b));
  const isDeleted = (id: string, at = 0) => deleted[id] !== undefined && deleted[id] >= at;

  const cards = mergeRecords(local.cards, remote.cards, newerCard);
  const noteAt = mergeRecords(local.noteAt ?? {}, remote.noteAt ?? {}, (a, b) => Math.max(a, b));
  const notes: Record<string, string> = {};
  for (const id of new Set([...Object.keys(local.notes), ...Object.keys(remote.notes), ...Object.keys(noteAt)])) {
    const lt = local.noteAt?.[id] ?? 0;
    const rt = remote.noteAt?.[id] ?? 0;
    const text = lt >= rt ? (local.notes[id] ?? (lt ? undefined : remote.notes[id])) : remote.notes[id];
    if (text) notes[id] = text;
  }
  const newerToggle = <T extends { at: number }>(a: T, b: T) => (a.at >= b.at ? a : b);
  const favorites = mergeRecords(local.favorites ?? {}, remote.favorites ?? {}, newerToggle);
  const known = mergeRecords(local.known ?? {}, remote.known ?? {}, newerToggle);

  const words = new Map<string, Word>();
  for (const w of [...remote.customWords, ...local.customWords]) {
    const prev = words.get(w.id);
    if (!prev || (w.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) words.set(w.id, w);
  }
  const customWords = [...words.values()].filter((w) => !isDeleted(w.id, w.updatedAt));
  for (const id of Object.keys(deleted)) {
    if (!words.has(id) || isDeleted(id, words.get(id)!.updatedAt)) {
      delete cards[id];
      delete notes[id];
      delete favorites[id];
      delete known[id];
    }
  }

  const lt = local.settingsUpdatedAt ?? 0;
  const rt = remote.settingsUpdatedAt ?? 0;
  // Zaman eşitse (ör. hesaplardan önce kaydedilmiş veri = 0) hedefi seçilmiş, yani gerçekten ayarlanmış taraf kazanır;
  // böylece yeni bir cihazdaki boş varsayılan ayarlar hesaptakileri ezmez.
  const localSettingsNewer = lt !== rt ? lt > rt : !!local.settings.goal || !remote.settings.goal;
  return {
    ...local,
    cards,
    notes,
    noteAt,
    favorites,
    known,
    customWords: sortByOrder(customWords, local.customWords, remote.customWords),
    deleted,
    // Ses seçimi cihaza özgüdür (her cihazın sesleri farklı); hep bu cihazınki kalır.
    settings: localSettingsNewer ? local.settings : { ...local.settings, ...remote.settings, voiceURI: local.settings.voiceURI },
    settingsUpdatedAt: Math.max(local.settingsUpdatedAt ?? 0, remote.settingsUpdatedAt ?? 0),
    days: mergeRecords(local.days, remote.days, maxDay),
  };
}

/** Görseller: kelime başına en son değişiklik (ekleme ya da silme) kazanır. */
export function mergeImages(local: ImageState, remote: ImageState | null | undefined): ImageState {
  if (!remote) return local;
  const images: Record<string, string> = {};
  const meta: ImageState['meta'] = {};
  const ids = new Set([...Object.keys(local.images), ...Object.keys(local.meta), ...Object.keys(remote.images), ...Object.keys(remote.meta)]);
  for (const id of ids) {
    const l = local.meta[id] ?? { at: 0 };
    const r = remote.meta[id] ?? { at: 0 };
    const [win, winImages, other] = l.at >= r.at ? [l, local.images, remote.images] : [r, remote.images, local.images];
    if (local.meta[id] || remote.meta[id]) meta[id] = win;
    if (win.removed) continue;
    const data = winImages[id] ?? other[id];
    if (data) images[id] = data;
  }
  return { images, meta };
}

function mergeRecords<T>(a: Record<string, T>, b: Record<string, T>, pick: (x: T, y: T) => T): Record<string, T> {
  const out: Record<string, T> = { ...b };
  for (const [k, v] of Object.entries(a)) out[k] = k in out ? pick(v, out[k]) : v;
  return out;
}

function newerCard(a: CardState, b: CardState): CardState {
  if (a.lastReviewed !== b.lastReviewed) return a.lastReviewed > b.lastReviewed ? a : b;
  return a.reps >= b.reps ? a : b;
}

function maxDay(a: DayLog, b: DayLog): DayLog {
  return {
    reviews: Math.max(a.reviews, b.reviews),
    correct: Math.max(a.correct, b.correct),
    newLearned: Math.max(a.newLearned, b.newLearned),
  };
}

/** Kendi kelimelerin sırası korunur (eklenme sırası): önce bu cihazdaki sıra, sonra yalnızca diğerinde olanlar. */
function sortByOrder(words: Word[], local: Word[], remote: Word[]): Word[] {
  const order = new Map<string, number>();
  [...local, ...remote].forEach((w, i) => order.has(w.id) || order.set(w.id, i));
  return words.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}

/** İki durum aynı mı? (Gereksiz yükleme ve yeniden çizimi önlemek için.) */
export function sameJSON(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
