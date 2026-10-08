import { describe, expect, it } from 'vitest';
import { checkTyped } from './answer';

describe('checkTyped', () => {
  it('ignores case, spaces and punctuation', () => {
    expect(checkTyped('  Look Forward To ', 'look forward to')).toBe('correct');
    expect(checkTyped('wake-up', 'wake up')).toBe('correct');
  });
  it('accepts British/American spelling variants', () => {
    expect(checkTyped('realize', 'realise')).toBe('correct');
    expect(checkTyped('neighbor', 'neighbour')).toBe('correct');
  });
  it('flags a single typo in longer words', () => {
    expect(checkTyped('colleage', 'colleague')).toBe('typo');
    expect(checkTyped('rnet', 'rent')).toBe('wrong');
  });
  it('rejects empty or wrong answers', () => {
    expect(checkTyped('', 'bill')).toBe('wrong');
    expect(checkTyped('borrow', 'lend')).toBe('wrong');
  });
});
