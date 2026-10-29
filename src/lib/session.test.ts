import { describe, expect, it } from 'vitest';
import { PACKS, WORDS, WORDS_BY_ID } from '../data/words';
import { buildSession, choicesFor, dueCards, EXAM_MAX, examSession, nextLevel, practiceSession, unseenWords } from './session';
import { DAY, newCard } from './srs';
import { daysUntil, emptyProgress, streak } from './storage';

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

describe('"learned" marks (Öğrendiklerim)', () => {
  it('keeps marked words out of daily reviews and new words until unmarked', () => {
    const p = emptyProgress();
    p.settings.level = 'A2';
    const [a, b] = WORDS.filter((w) => w.level === 'A2');
    p.cards[a.id] = { ...newCard(a.id, T0 - 5 * DAY), due: T0 - DAY };
    p.known = { [a.id]: { on: true, at: T0 }, [b.id]: { on: true, at: T0 } };
    expect(dueCards(p, T0)).toHaveLength(0);
    expect(unseenWords(p).some((w) => w.id === b.id)).toBe(false);
    p.known[a.id] = { on: false, at: T0 + 1 };
    expect(dueCards(p, T0).map((c) => c.wordId)).toEqual([a.id]);
  });

  it('does not introduce built-in words marked as already known in a quick quiz', () => {
    const p = emptyProgress();
    const [a, b] = WORDS;
    p.known = { [a.id]: { on: true, at: T0 } };
    const steps = practiceSession(p, [a.id, b.id], seeded());
    expect(steps.filter((s) => s.kind === 'learn').map((s) => s.wordId)).toEqual([b.id]);
    const quizA = steps.find((s) => s.kind === 'quiz' && s.wordId === a.id);
    expect(quizA).toMatchObject({ graded: false, practice: true });
  });

  it('builds an ungraded mixed exam of at most 20 questions without intro cards', () => {
    const ids = WORDS.slice(0, 30).map((w) => w.id);
    const steps = examSession(ids, seeded());
    expect(steps).toHaveLength(EXAM_MAX);
    expect(steps.every((s) => s.kind === 'quiz' && !s.graded && s.practice)).toBe(true);
    expect(new Set(steps.map((s) => s.wordId)).size).toBe(EXAM_MAX);
    expect(examSession(ids.slice(0, 3), seeded())).toHaveLength(3);
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

describe('goals', () => {
  it('draws new words from the Academic Core pack for exam goals, easiest first', () => {
    const p = emptyProgress();
    p.settings.goal = 'yds';
    p.settings.level = 'A1';
    const words = unseenWords(p);
    expect(words).toEqual(PACKS.academic.words);
    expect(words.length).toBeGreaterThanOrEqual(150);
    expect(words[0].level).toBe('B1');
    const steps = buildSession(p, T0, {}, seeded());
    expect(steps.every((s) => PACKS.academic.words.some((w) => w.id === s.wordId))).toBe(true);
  });

  it('gives every pack word at least two synonyms', () => {
    for (const w of PACKS.academic.words) {
      expect(w.synonyms?.length, w.en).toBeGreaterThanOrEqual(2);
      expect(w.synonyms, w.en).not.toContain(w.en);
    }
  });

  it('has no word twice', () => {
    expect(new Set(WORDS.map((w) => w.en)).size).toBe(WORDS.length);
  });
});

describe('daysUntil', () => {
  it('counts calendar days to the exam', () => {
    expect(daysUntil('2026-01-10', T0)).toBe(0);
    expect(daysUntil('2026-01-25', T0)).toBe(15);
    expect(daysUntil('2026-01-01', T0)).toBeNull();
    expect(daysUntil(null, T0)).toBeNull();
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
