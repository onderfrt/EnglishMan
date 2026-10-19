import { WORDS, WORDS_BY_ID, type Word } from '../data/words';

/**
 * Uygulamadaki tüm kelimeler: hazır kelimeler + kullanıcının kendi eklediği kelimeler.
 * Kendi kelimeler ilerleme kaydında tutulur; App her değişiklikte setCustomWords ile burayı günceller.
 */
let custom: Word[] = [];
let all: Word[] = WORDS;
let byId: Record<string, Word> = WORDS_BY_ID;

export function setCustomWords(words: Word[]): void {
  if (words === custom) return;
  custom = words;
  all = [...WORDS, ...words];
  byId = { ...WORDS_BY_ID, ...Object.fromEntries(words.map((w) => [w.id, w])) };
}

export function allWords(): Word[] {
  return all;
}

export function customWords(): Word[] {
  return custom;
}

export function wordById(id: string): Word | undefined {
  return byId[id];
}
