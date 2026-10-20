import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bestMeaning, lookup, parseEntry } from './dictionary';

const dict = JSON.parse(fs.readFileSync('public/dictionary-en-tr.json', 'utf8')) as Record<string, string>;

describe('dictionary', () => {
  it('parses entries grouped by part of speech', () => {
    expect(parseEntry('n:masa;tablo|v:ertelemek')).toEqual([
      { pos: 'noun', meanings: ['masa', 'tablo'] },
      { pos: 'verb', meanings: ['ertelemek'] },
    ]);
  });
  it('knows common words, with the usual meaning among the first suggestions', () => {
    const has = (en: string, tr: string) => lookup(en, dict)[0]?.meanings.includes(tr);
    expect(has('important', 'önemli')).toBe(true);
    expect(has('table', 'masa')).toBe(true);
    expect(has('happy', 'mutlu')).toBe(true);
    expect(has('tired', 'yorgun')).toBe(true);
    expect(has('opportunity', 'fırsat')).toBe(true);
    expect(lookup('  Wealth ', dict)[0].meanings[0]).toBe('zenginlik');
    expect(bestMeaning(lookup('borrow', dict))).toContain('ödünç almak');
    expect(Object.keys(dict).length).toBeGreaterThan(15000);
  });
});
