import { afterEach, describe, expect, it } from 'vitest';
import { setCustomWords } from './catalog';
import { EMPTY_INPUT, parseImport, splitLine, toCustomWord, toInput } from './customWords';
import { buildSession, sourceWords } from './session';
import { emptyProgress } from './storage';

afterEach(() => setCustomWords([]));

describe('splitLine', () => {
  it('understands tabs, semicolons, dashes and quoted CSV', () => {
    expect(splitLine('abandon\tterk etmek')).toEqual(['abandon', 'terk etmek']);
    expect(splitLine('abandon ; terk etmek ; They left, then cried. ; Gittiler.')).toEqual([
      'abandon ', ' terk etmek ', ' They left, then cried. ', ' Gittiler.',
    ]);
    expect(splitLine('look up - aramak (sözlükte)')).toEqual(['look up', 'aramak (sözlükte)']);
    expect(splitLine('abandon,terk etmek,"We left, sadly.",Üzülerek ayrıldık.')).toEqual([
      'abandon', 'terk etmek', 'We left, sadly.', 'Üzülerek ayrıldık.',
    ]);
  });
});

describe('parseImport', () => {
  it('skips the header, flags duplicates and invalid lines', () => {
    const rows = parseImport('kelime;anlam\nabandon;terk etmek\nborrow;ödünç almak\nabandon;bırakmak\nsadece kelime\n\n');
    expect(rows.map((r) => r.status)).toEqual(['new', 'duplicate', 'duplicate', 'invalid']);
    expect(rows[0].input).toMatchObject({ en: 'abandon', tr: 'terk etmek' });
    expect(rows[1].existing?.en).toBe('borrow'); // hazır listede zaten var
  });
});

describe('custom words', () => {
  it('round-trips through the form and ignores the word itself as a synonym', () => {
    const w = toCustomWord(
      { ...EMPTY_INPUT, en: '  give in ', tr: 'pes etmek', synonyms: 'surrender, give in,  yield ' },
      'custom:1',
      'B1',
    );
    expect(w).toMatchObject({ en: 'give in', topic: 'custom', custom: true, emoji: '📝', synonyms: ['surrender', 'yield'] });
    expect(toInput(w)).toMatchObject({ en: 'give in', emoji: '', synonyms: 'surrender, yield' });
  });

  it('teaches custom words first, whatever the goal', () => {
    const own = toCustomWord({ ...EMPTY_INPUT, en: 'abandon', tr: 'terk etmek' }, 'custom:a', 'B2');
    setCustomWords([own]);
    const p = emptyProgress();
    p.settings.goal = 'yds';
    expect(sourceWords(p)[0]).toBe(own);
    const steps = buildSession(p, Date.now());
    expect(steps[0]).toMatchObject({ kind: 'learn', wordId: 'custom:a' });
  });
});

describe('parseImport with dictionary', () => {
  it('fills missing meanings from the dictionary and marks them', () => {
    const rows = parseImport('serendipitous\nzeal ; şevk\nqwertyuiop', (en) => (en === 'serendipitous' ? 'rastlantısal' : ''));
    expect(rows[0]).toMatchObject({ status: 'new', autoMeaning: true, input: { tr: 'rastlantısal' } });
    expect(rows[1].autoMeaning).toBeUndefined();
    expect(rows[2].status).toBe('invalid');
  });
});
