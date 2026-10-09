import { describe, expect, it } from 'vitest';
import { WORDS, WORDS_BY_ID } from '../data/words';
import { buildSession, choicesFor, nextLevel, unseenWords } from './session';
import { DAY, newCard } from './srs';
import { emptyProgress, streak } from './storage';

const T0 = new Date(2026, 0, 10, 15).getTime();
const seeded = () => {
  let s = 42;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
};

describe('word data', () => {
  it('has unique ids and complete fields', () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
    for (const w of WORDS) {
      expect(w.en && w.tr && w.emoji && w.example && w.exampleTr).toBeTruthy();
    }
  });
});

describe('buildSession', () => {
  it('introduces new words in chunks: learn then quiz', () => {
    const p = emptyProgress();
    p.settings.level = 'A2';
    p.settings.newPerDay = 5;
    const steps = buildSession(p, T0, {}, seeded());
    expect(steps.map((s) => s.kind)).toEqual([
      'learn', 'learn', 'learn', 'learn', 'quiz', 'quiz', 'quiz', 'quiz', 'learn', 'quiz',
    ]);
    expect(steps.every((s) => WORDS_BY_ID[s.wordId].level === 'A2')).toBe(true);
  });

  it('puts due reviews first and respects the daily new-word limit', () => {
    const p = emptyProgress();
    p.settings.newPerDay = 3;
    p.days['2026-01-10'] = { reviews: 2, correct: 2, newLearned: 2 };
    p.cards[WORDS[0].id] = { ...newCard(WORDS[0].id, T0 - 5 * DAY), due: T0 - DAY };
    p.cards[WORDS[1].id] = { ...newCard(WORDS[1].id, T0), due: T0 + DAY };
    const steps = buildSession(p, T0, {}, seeded());
    expect(steps[0]).toMatchObject({ kind: 'quiz', wordId: WORDS[0].id });
    expect(steps.filter((s) => s.kind === 'learn')).toHaveLength(1);
    expect(steps.some((s) => s.wordId === WORDS[1].id)).toBe(false);
  });
});

describe('levels', () => {
  it('only offers new words from the chosen level', () => {
    const p = emptyProgress();
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const) {
      p.settings.level = level;
      const words = unseenWords(p);
      expect(words.length).toBeGreaterThanOrEqual(30);
      expect(words.every((w) => w.level === level)).toBe(true);
    }
    expect(nextLevel('B1')).toBe('B2');
    expect(nextLevel('C2')).toBeNull();
  });

  it('prefers distractors of the same part of speech and a nearby level', () => {
    const w = WORDS.find((x) => x.en === 'meticulous')!;
    const c = choicesFor(w, seeded()).filter((x) => x !== w);
    expect(c.every((x) => x.pos === 'adjective' && ['C1', 'C2'].includes(x.level))).toBe(true);
  });
});

describe('choicesFor', () => {
  it('returns 4 distinct options including the answer', () => {
    const w = WORDS[5];
    const c = choicesFor(w, seeded());
    expect(c).toHaveLength(4);
    expect(c).toContain(w);
    expect(new Set(c.map((x) => x.tr)).size).toBe(4);
  });
});

describe('streak', () => {
  it('counts consecutive days, tolerating an unfinished today', () => {
    const log = { reviews: 1, correct: 1, newLearned: 0 };
    expect(streak({ '2026-01-08': log, '2026-01-09': log }, T0)).toBe(2);
    expect(streak({ '2026-01-08': log, '2026-01-09': log, '2026-01-10': log }, T0)).toBe(3);
    expect(streak({ '2026-01-08': log }, T0)).toBe(0);
  });
});
