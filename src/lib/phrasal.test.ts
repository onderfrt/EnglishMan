import { afterEach, describe, expect, it } from 'vitest';
import { PHRASAL_VERBS } from '../data/phrasalVerbs';
import { setCustomWords } from './catalog';
import { EMPTY_INPUT, parseImport, toCustomWord } from './customWords';
import { findInSentence, inflect } from './exam';
import { curatedMeaning, looksPhrasal, phrasalMeaning, suggestPhrasal } from './phrasal';
import { buildSession, inOwnList } from './session';
import { emptyProgress } from './storage';

afterEach(() => setCustomWords([]));

const own = (en: string, pos: 'phrasal verb' | 'verb' | 'other', id = `custom:${en}`) =>
  toCustomWord({ ...EMPTY_INPUT, en, tr: 'x', pos }, id, 'B1');

describe('phrasal verb detection', () => {
  it('recognises verb + particle(s) and listed idioms, not ordinary words', () => {
    for (const en of ['give up', 'look forward to', 'put up with', 'get rid of', 'take part in', '  Break  Down ']) {
      expect(looksPhrasal(en), en).toBe(true);
    }
    for (const en of ['abandon', 'climate change', 'give', 'make a decision']) expect(looksPhrasal(en), en).toBe(false);
  });

  it('has a clean, duplicate-free built-in list', () => {
    const keys = PHRASAL_VERBS.map(([en]) => en);
    expect(new Set(keys).size).toBe(keys.length);
    for (const [en, tr] of PHRASAL_VERBS) {
      expect(en).toBe(en.trim().toLowerCase());
      expect(tr.length).toBeGreaterThan(2);
    }
  });
});

describe('suggestPhrasal', () => {
  const dict = { 'give over': 'v:bırakmak;son vermek', 'give up': 'v:fedakarlık etmek', table: 'n:masa' };

  it('suggests phrasal verbs for a typed verb, with meanings that can fill the form', () => {
    const s = suggestPhrasal('give', dict);
    const en = s.map((x) => x.en);
    expect(en).toEqual(expect.arrayContaining(['give up', 'give in', 'give away', 'give over']));
    expect(new Set(en).size).toBe(en.length);
    // Uygulamadaki hazır "give up" bilgileriyle önce gelir; listede olan "give in" anlamıyla gelir.
    expect(s[0]).toMatchObject({ en: 'give up' });
    expect(s[0].word).toBeDefined();
    expect(s.find((x) => x.en === 'give in')?.meaning).toBe(curatedMeaning('give in'));
    // Sözlükten gelenler yalnızca ipucu taşır.
    expect(s.find((x) => x.en === 'give over')).toMatchObject({ hint: 'bırakmak, son vermek' });
    expect(s.find((x) => x.en === 'give over')?.meaning).toBeUndefined();
  });

  it('narrows as you type and lists the user’s own phrasal verbs too', () => {
    setCustomWords([own('give it a go', 'phrasal verb')]);
    expect(suggestPhrasal('give i', dict).map((x) => x.en)).toEqual(['give it a go', 'give in']);
    expect(suggestPhrasal('g', dict)).toEqual([]);
  });

  it('fills missing meanings in bulk import from the list first, then the dictionary', () => {
    expect(phrasalMeaning('put off', null)).toBe('ertelemek');
    expect(phrasalMeaning('give over', dict)).toBe('bırakmak, son vermek');
    expect(phrasalMeaning('zzz up', dict)).toBe('');
  });
});

describe('Phrasal verb’lerim list', () => {
  it('keeps phrasal verbs and other own words in separate lists', () => {
    expect(inOwnList(own('give in', 'phrasal verb'), 'phrasal')).toBe(true);
    expect(inOwnList(own('give in', 'phrasal verb'), 'own')).toBe(false);
    expect(inOwnList(own('abandon', 'verb'), 'own')).toBe(true);
  });

  it('imports every row as a phrasal verb and moves an own word of another type over', () => {
    setCustomWords([own('carry on', 'other')]);
    const rows = parseImport('put off\ncarry on ; devam etmek', (en) => phrasalMeaning(en, null), 'phrasal verb');
    expect(rows[0]).toMatchObject({ status: 'new', input: { en: 'put off', tr: 'ertelemek', pos: 'phrasal verb' }, autoMeaning: true });
    expect(rows[1]).toMatchObject({ status: 'update', changes: { tr: 'devam etmek', pos: 'phrasal verb' } });
    // Kelimelerim'e normal yüklemede tür değişmez.
    expect(parseImport('carry on ; x')[0].changes?.pos).toBeUndefined();
  });

  it('skips single words in a phrasal verb import and leaves the own word alone', () => {
    setCustomWords([own('abolish', 'verb')]);
    const [row] = parseImport('abolish ; yürürlükten kaldırmak', undefined, 'phrasal verb');
    expect(row.status).toBe('notphrasal');
    expect(row.changes).toBeUndefined();
  });

  it('studies only the chosen list', () => {
    const p = emptyProgress();
    p.customWords = [own('give in', 'phrasal verb'), own('abandon', 'verb'), own('put off', 'phrasal verb')];
    setCustomWords(p.customWords);
    const phrasal = buildSession(p, Date.now(), { phrasal: true, extraNew: 4 });
    expect(new Set(phrasal.map((s) => s.wordId))).toEqual(new Set(['custom:give in', 'custom:put off']));
    const words = buildSession(p, Date.now(), { own: true, extraNew: 4 });
    expect(new Set(words.map((s) => s.wordId))).toEqual(new Set(['custom:abandon']));
  });
});

describe('phrasal verbs in fill-in-the-blank questions', () => {
  it('inflects only the verb, doubling where English does', () => {
    expect(inflect('run out of', 'ing')).toBe('running out of');
    expect(inflect('get up', 'ing')).toBe('getting up');
    expect(inflect('give up', 's')).toBe('gives up');
  });

  it('never guesses a past tense for irregular verbs ("taked off")', () => {
    const takeOff = own('take off', 'phrasal verb');
    expect(findInSentence(takeOff, 'The plane taked off.')).toBeNull();
    expect(findInSentence(takeOff, 'The plane is taking off now.')).toMatchObject({ form: 'taking off', type: 'ing' });
    expect(findInSentence(own('turn down', 'phrasal verb'), 'She turned down the offer.')).toMatchObject({ form: 'turned down' });
  });
});
