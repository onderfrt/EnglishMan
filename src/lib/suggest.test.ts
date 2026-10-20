import { describe, expect, it } from 'vitest';
import { buildWordlist } from '../../wordlist-asset';
import { suggest } from './suggest';

const list = ['image', 'imagine', 'immediate', 'impact', 'important', 'improve', 'table'];

describe('suggest', () => {
  it('needs at least two letters', () => {
    expect(suggest('i', list)).toEqual([]);
  });
  it('shows app words (with meaning) first, then the word list', () => {
    const s = suggest('im', list);
    expect(s[0].word).toBeDefined(); // ör. impact / improve uygulamada var
    expect(s.map((x) => x.en)).toContain('important');
    expect(new Set(s.map((x) => x.en.toLowerCase())).size).toBe(s.length);
    expect(s.length).toBeLessThanOrEqual(12);
  });
  it('hides the list when the word is already complete', () => {
    expect(suggest('table', list)).toEqual([]);
  });

  it('suggests "important" after typing "im" (kullanıcının örneği)', () => {
    const real = buildWordlist();
    expect(suggest('im', real).map((x) => x.en)).toContain('important');
    expect(suggest('imp', real).map((x) => x.en)).toContain('important');
  });
});
