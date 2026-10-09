import { GOALS, LEVEL_ORDER, PACKS, WORDS, WORDS_BY_ID, type Level, type TopicId, type Word } from '../data/words';
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

const levelDistance = (a: Level, b: Level) => Math.abs(LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));

/**
 * Çeldirici şıklar: mümkünse aynı türden (fiil/sıfat...) ve yakın seviyeden kelimeler seçilir
 * ki doğru cevap tahminle ya da eleme yoluyla bulunmasın.
 */
export function choicesFor(word: Word, rng: Rng = Math.random, count = 4): Word[] {
  const others = shuffle(
    WORDS.filter((w) => w.id !== word.id && w.tr !== word.tr && w.en !== word.en),
    rng,
  );
  const score = (w: Word) => (w.pos === word.pos ? 0 : 2) + Math.min(levelDistance(w.level, word.level), 2);
  const picked = others.sort((a, b) => score(a) - score(b)).slice(0, count - 1);
  return shuffle([word, ...picked], rng);
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

/**
 * Yeni kelimelerin geldiği kaynak: sınav hedefinde hedefin paketi (ör. Akademik Çekirdek),
 * Genel İngilizce'de seçili seviyenin kelimeleri.
 */
export function sourceWords(p: Progress): Word[] {
  const pack = p.settings.goal && GOALS[p.settings.goal].pack;
  if (pack) return PACKS[pack].words;
  const level = p.settings.level;
  return WORDS.filter((w) => !level || w.level === level);
}

/** Kaynakta henüz çalışılmamış kelimeler. */
export function unseenWords(p: Progress, topic?: TopicId): Word[] {
  return sourceWords(p).filter((w) => !p.cards[w.id] && (!topic || w.topic === topic));
}

export function nextLevel(level: Level): Level | null {
  return LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1] ?? null;
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
