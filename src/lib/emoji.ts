/** Emoji metnini tek tek emojilere (grafem) ayırır: "👋💼" → ["👋", "💼"]. */
export function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
  }
  return Array.from(text);
}

/**
 * Emoji görsel dosyasının adı: kod noktaları, FE0F (görünüm seçici) atlanarak, "-" ile birleştirilir.
 * Örnek: "☀️" → "2600", "👨‍👩‍👧" → "1f468-200d-1f469-200d-1f467".
 */
export function emojiCode(g: string): string {
  return Array.from(g)
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((c) => c !== 'fe0f')
    .join('-');
}
