import { describe, expect, it } from 'vitest';
import { sourceIndex, usedEmojiCodes } from '../../emoji-assets';
import { emojiCode, graphemes } from './emoji';

describe('emoji helpers', () => {
  it('splits scenes into single emojis', () => {
    expect(graphemes('👋💼')).toEqual(['👋', '💼']);
    expect(graphemes('👨‍👩‍👧')).toHaveLength(1);
  });
  it('builds file codes without FE0F', () => {
    expect(emojiCode('☀️')).toBe('2600');
    expect(emojiCode('🍎')).toBe('1f34e');
  });
  it('has a 3D image for every emoji used in the app', () => {
    const index = sourceIndex();
    const missing = [...usedEmojiCodes()].filter((c) => !index.has(c));
    expect(missing).toEqual([]);
  });
});
