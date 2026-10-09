import { useState } from 'react';
import { emojiCode, graphemes } from '../lib/emoji';

/**
 * Emojiyi her cihazda aynı görünen 3D görsel olarak çizer (Microsoft Fluent Emoji 3D).
 * Birden fazla emoji varsa yan yana bir "sahne" oluşturur. Görsel bulunamazsa cihazın emojisi gösterilir.
 */
export function EmojiArt({ emoji, className = '' }: { emoji: string; className?: string }) {
  const parts = graphemes(emoji);
  return (
    <span className={`emoji-art n${Math.min(parts.length, 3)} ${className}`} aria-hidden>
      {parts.map((g, i) => (
        <EmojiImage key={`${i}-${g}`} g={g} />
      ))}
    </span>
  );
}

function EmojiImage({ g }: { g: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="emoji-native">{g}</span>;
  return (
    <img
      src={`${import.meta.env.BASE_URL}emoji/${emojiCode(g)}.webp`}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
