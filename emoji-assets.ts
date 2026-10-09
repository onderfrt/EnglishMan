import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { TOPICS, WORDS } from './src/data/words.ts';
import { emojiCode, graphemes } from './src/lib/emoji.ts';

/**
 * Microsoft Fluent Emoji 3D (MIT lisanslı) görsellerinden yalnızca uygulamada kullanılanları
 * public/emoji/ klasörüne kopyalar. Böylece görseller her telefonda aynı görünür ve çevrimdışı çalışır.
 */
const SOURCE = path.resolve('node_modules/@lobehub/fluent-emoji-3d/assets');
const TARGET = path.resolve('public/emoji');

export function usedEmojiCodes(): Set<string> {
  const all = [...WORDS.map((w) => w.emoji), ...Object.values(TOPICS).map((t) => t.emoji), '🎉', '💪', '🌱', '🎯'];
  return new Set(all.flatMap(graphemes).map(emojiCode));
}

/** Paketteki dosyaları FE0F'siz kod adına göre indeksler. */
export function sourceIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const file of fs.readdirSync(SOURCE)) {
    const code = file.replace(/\.webp$/, '').split('-').filter((c) => c !== 'fe0f').join('-');
    if (!index.has(code)) index.set(code, file);
  }
  return index;
}

export function syncEmojiAssets(): string[] {
  const index = sourceIndex();
  fs.rmSync(TARGET, { recursive: true, force: true });
  fs.mkdirSync(TARGET, { recursive: true });
  const missing: string[] = [];
  for (const code of usedEmojiCodes()) {
    const file = index.get(code);
    if (file) fs.copyFileSync(path.join(SOURCE, file), path.join(TARGET, `${code}.webp`));
    else missing.push(code);
  }
  return missing;
}

export function emojiAssets(): Plugin {
  return {
    name: 'emoji-assets',
    configResolved() {
      const missing = syncEmojiAssets();
      if (missing.length) console.warn(`[emoji-assets] 3D görseli olmayan emojiler (yerel emoji gösterilecek): ${missing.join(', ')}`);
    },
  };
}
