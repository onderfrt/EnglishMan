/**
 * Aralıklı tekrar (Spaced Repetition) — SM-2 algoritmasının sadeleştirilmiş hâli.
 *
 * Fikir: Bir kelimeyi tam unutmak üzereyken tekrar etmek hafızayı en çok güçlendirir.
 * Doğru bildikçe tekrar aralığı uzar (1 gün → 3 gün → 7 gün → ...),
 * yanlış bildiğinde kelime kısa süre sonra tekrar karşına çıkar.
 */

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface CardState {
  wordId: string;
  /** Kaç kez üst üste doğru hatırlandı. */
  reps: number;
  /** Kaç kez unutuldu. */
  lapses: number;
  /** Kolaylık katsayısı: aralığın ne kadar hızlı büyüyeceği (min 1.3). */
  ease: number;
  /** Mevcut tekrar aralığı (gün). */
  interval: number;
  /** Bir sonraki tekrar zamanı (ms). */
  due: number;
  /** Kelimenin ilk öğrenildiği an (ms). */
  learnedAt: number;
  lastReviewed: number;
}

export const DAY = 24 * 60 * 60 * 1000;
export const MINUTE = 60 * 1000;
const MIN_EASE = 1.3;
const RELEARN_DELAY = 10 * MINUTE;

export function newCard(wordId: string, now: number): CardState {
  return { wordId, reps: 0, lapses: 0, ease: 2.5, interval: 0, due: now, learnedAt: now, lastReviewed: 0 };
}

export function review(card: CardState, grade: Grade, now: number): CardState {
  let { reps, lapses, ease, interval } = card;

  if (grade === 'again') {
    lapses += 1;
    reps = 0;
    ease = Math.max(MIN_EASE, ease - 0.2);
    interval = 0;
    return { ...card, reps, lapses, ease, interval, due: now + RELEARN_DELAY, lastReviewed: now };
  }

  if (reps === 0) {
    interval = grade === 'easy' ? 3 : 1;
  } else if (reps === 1) {
    interval = grade === 'hard' ? 2 : grade === 'easy' ? 6 : 3;
  } else if (grade === 'hard') {
    interval = Math.max(interval + 1, Math.round(interval * 1.2));
  } else if (grade === 'good') {
    interval = Math.max(interval + 1, Math.round(interval * ease));
  } else {
    interval = Math.max(interval + 1, Math.round(interval * ease * 1.3));
  }

  if (grade === 'hard') ease = Math.max(MIN_EASE, ease - 0.15);
  if (grade === 'easy') ease += 0.15;
  reps += 1;

  return { ...card, reps, lapses, ease, interval, due: now + interval * DAY, lastReviewed: now };
}

export function isDue(card: CardState, now: number): boolean {
  return card.due <= now;
}

/** 21 günden uzun aralığa ulaşan kelime "kalıcı" sayılır. */
export function isMastered(card: CardState): boolean {
  return card.interval >= 21;
}

/** Bir sonraki tekrara kalan süreyi okunur hâle getirir. */
export function formatDue(due: number, now: number): string {
  const ms = due - now;
  if (ms <= 0) return 'şimdi';
  if (ms < 60 * MINUTE) return `${Math.ceil(ms / MINUTE)} dk sonra`;
  if (ms < DAY) return `${Math.round(ms / (60 * MINUTE))} saat sonra`;
  return formatInterval(Math.round(ms / DAY));
}

export function formatInterval(days: number): string {
  if (days <= 0) return 'birazdan';
  if (days === 1) return 'yarın';
  if (days < 30) return `${days} gün sonra`;
  if (days < 365) return `${Math.round(days / 30)} ay sonra`;
  return `${(days / 365).toFixed(1)} yıl sonra`;
}
