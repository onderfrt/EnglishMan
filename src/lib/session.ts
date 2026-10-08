import { WORDS, WORDS_BY_ID, type TopicId, type Word } from '../data/words';
import type { CardState } from './srs';
import { dayKey, type Progress } from './storage';

/**
 * Soru tipleri. Kelime ilerledikçe zorlaşır:
 * önce tanıma (İngilizce → Türkçe seç), sonra hatırlama (Türkçe → İngilizce seç),
 * en son üretme (İngilizcesini yaz / duyduğunu yaz). Farklı yönlerden hatırlamak öğrenmeyi derinleştirir.
 */
export type QuizMode = 'choice-en-tr' | 'choice-tr-en' | 'listen-choice' | 'type-tr-en' | 'listen-type';

export type Step =
  | { kind: 'learn'; wordId: string }
  | { kind: 'quiz'; wordId: string; mode: QuizMode; /** Yalnızca ilk deneme SRS'e işlenir. */ graded: boolean };

export type Rng = () => number;

export function shuffle<T>(arr: T[], rng: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function modeFor(card: CardState | undefined, rng: Rng = Math.random): QuizMode {
  const reps = card?.reps ?? 0;
  if (reps === 0) return 'choice-en-tr';
  if (reps === 1) return pick<QuizMode>(['choice-tr-en', 'listen-choice'], rng);
  return pick<QuizMode>(['type-tr-en', 'type-tr-en', 'listen-type', 'choice-tr-en'], rng);
}

/** Yanlış cevaptan sonra aynı kelime oturum içinde daha kolay bir soruyla tekrar sorulur. */
export function retryMode(mode: QuizMode): QuizMode {
  return mode === 'type-tr-en' || mode === 'listen-type' ? 'choice-tr-en' : mode;
}

/** Çeldirici şıklar: mümkünse aynı türden (fiil/sıfat...) kelimeler seçilir ki tahminle bulunmasın. */
export function choicesFor(word: Word, rng: Rng = Math.random, count = 4): Word[] {
  const others = WORDS.filter((w) => w.id !== word.id && w.tr !== word.tr && w.en !== word.en);
  const samePos = shuffle(others.filter((w) => w.pos === word.pos), rng);
  const rest = shuffle(others.filter((w) => w.pos !== word.pos), rng);
  return shuffle([word, ...[...samePos, ...rest].slice(0, count - 1)], rng);
}

export interface SessionOptions {
  topic?: TopicId;
  /** Günlük yeni kelime limitine takılmadan ekstra yeni kelime çalış. */
  extraNew?: number;
}

export function newWordsLeftToday(p: Progress, now: number): number {
  return Math.max(0, p.settings.newPerDay - (p.days[dayKey(now)]?.newLearned ?? 0));
}

export function dueCards(p: Progress, now: number): CardState[] {
  return Object.values(p.cards)
    .filter((c) => c.due <= now && WORDS_BY_ID[c.wordId])
    .sort((a, b) => a.due - b.due);
}

export function unseenWords(p: Progress, topic?: TopicId): Word[] {
  const words = WORDS.filter((w) => !p.cards[w.id] && (!topic || w.topic === topic));
  // Önce A2, sonra B1 kelimeler.
  return [...words.filter((w) => w.level === 'A2'), ...words.filter((w) => w.level === 'B1')];
}

const CHUNK = 4;

export function buildSession(p: Progress, now: number, opts: SessionOptions = {}, rng: Rng = Math.random): Step[] {
  const reviews = dueCards(p, now)
    .filter((c) => !opts.topic || WORDS_BY_ID[c.wordId].topic === opts.topic)
    .slice(0, p.settings.maxReviewsPerSession);

  const steps: Step[] = shuffle(reviews, rng).map((c) => ({
    kind: 'quiz',
    wordId: c.wordId,
    mode: modeFor(c, rng),
    graded: true,
  }));

  const newCount = opts.extraNew ?? newWordsLeftToday(p, now);
  const fresh = unseenWords(p, opts.topic).slice(0, newCount);

  // Yeni kelimeler 4'erli gruplar hâlinde: önce tanış, hemen ardından karışık sırayla test et.
  for (let i = 0; i < fresh.length; i += CHUNK) {
    const chunk = fresh.slice(i, i + CHUNK);
    steps.push(...chunk.map((w): Step => ({ kind: 'learn', wordId: w.id })));
    steps.push(
      ...shuffle(chunk, rng).map((w): Step => ({ kind: 'quiz', wordId: w.id, mode: 'choice-en-tr', graded: true })),
    );
  }
  return steps;
}
