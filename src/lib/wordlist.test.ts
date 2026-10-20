import { describe, expect, it } from 'vitest';
import { buildWordlist } from '../../wordlist-asset';

describe('wordlist', () => {
  const list = buildWordlist();
  it('contains common base words, frequent ones first', () => {
    for (const w of ['important', 'image', 'imagine', 'improve', 'colour', 'abandon', 'imply', 'friendly', 'daily']) expect(list, w).toContain(w);
    expect(list.indexOf('important')).toBeLessThan(list.indexOf('imbecile') === -1 ? Infinity : list.indexOf('imbecile'));
  });
  it('drops inflected forms and proper nouns', () => {
    for (const w of ['images', 'implemented', 'stopped', 'making', 'studies']) expect(list, w).not.toContain(w);
    expect(list.every((w) => /^[a-z-]+$/.test(w))).toBe(true);
  });
  it('stays small', () => {
    expect(list.length).toBeGreaterThan(10000);
    expect(list.length).toBeLessThan(30000);
  });
});
