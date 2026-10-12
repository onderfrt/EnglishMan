import { describe, expect, it } from 'vitest';
import { PACKS, WORDS } from '../data/words';
import { clozeQuestion, findInSentence, inflect, synonymQuestion } from './exam';

const seeded = (seed = 7) => {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
};
const word = (en: string) => WORDS.find((w) => w.en === en)!;

describe('inflect', () => {
  it('handles common English spelling rules', () => {
    expect(inflect('analyse', 'ed')).toBe('analysed');
    expect(inflect('study', 'ed')).toBe('studied');
    expect(inflect('occur', 'ed')).toBe('occurred');
    expect(inflect('policy', 's')).toBe('policies');
    expect(inflect('approach', 's')).toBe('approaches');
    expect(inflect('emerge', 'ing')).toBe('emerging');
    expect(inflect('result in', 'ed')).toBe('resulted in');
  });
});

describe('findInSentence', () => {
  it('finds inflected forms and phrases', () => {
    expect(findInSentence(word('analyse'), word('analyse').example)).toMatchObject({ form: 'analysed', type: 'ed' });
    expect(findInSentence(word('result in'), word('result in').example)).toMatchObject({ form: 'resulted in' });
    expect(findInSentence(word('despite'), word('despite').example)).toMatchObject({ index: 0, form: 'Despite' });
  });
  it('returns null for irregular forms', () => {
    expect(findInSentence(word('lend'), word('lend').example)).toBeNull(); // "lent"
  });
});

describe('clozeQuestion', () => {
  it('works for most Academic Core words', () => {
    const ok = PACKS.academic.words.filter((w) => clozeQuestion(w, seeded()));
    expect(ok.length / PACKS.academic.words.length).toBeGreaterThan(0.9);
    // Bağlaç ve edatlar da sorulabilmeli (although ↔ despite ayrımı).
    for (const en of ['although', 'despite', 'whereas', 'unless']) expect(clozeQuestion(word(en), seeded()), en).not.toBeNull();
  });
  it('gives five distinct options in the same form, one of them correct', () => {
    for (const w of PACKS.academic.words) {
      const q = clozeQuestion(w, seeded());
      if (!q) continue;
      expect(q.options, w.en).toHaveLength(5);
      expect(new Set(q.options).size, w.en).toBe(5);
      expect(q.options, w.en).toContain(q.answer);
      expect((q.before + q.answer + q.after).toLowerCase(), w.en).toBe(w.example.toLowerCase());
    }
    const q = clozeQuestion(word('analyse'), seeded())!;
    expect(q.options.every((o) => o.endsWith('ed'))).toBe(true);
  });
});

describe('synonymQuestion', () => {
  it('uses a real synonym as the answer and unrelated distractors', () => {
    for (const w of PACKS.academic.words) {
      const q = synonymQuestion(w, seeded());
      expect(q, w.en).not.toBeNull();
      expect(w.synonyms, w.en).toContain(q!.answer);
      expect(new Set(q!.options).size, w.en).toBe(5);
      for (const o of q!.options.filter((o) => o !== q!.answer)) {
        expect(w.synonyms, `${w.en}: ${o}`).not.toContain(o);
      }
    }
  });
});
