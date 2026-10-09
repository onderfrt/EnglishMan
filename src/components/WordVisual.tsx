import { useRef, useState } from 'react';
import type { Word } from '../data/words';
import { removeUserImage, setUserImage, useUserImage } from '../lib/images';
import { EmojiArt } from './EmojiArt';

/**
 * Kelimenin görseli. Arka plan rengi kelime türünü gösterir (isim mavi, fiil yeşil, sıfat turuncu...).
 * Kullanıcı kendi fotoğrafını eklediyse o gösterilir, emoji köşede küçük kalır.
 */
export function WordVisual({ word, editable = false, small = false }: { word: Word; editable?: boolean; small?: boolean }) {
  const userImage = useUserImage(word.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const posClass = `pos-${word.pos.replace(' ', '-')}`;

  return (
    <div className={`word-visual ${small ? 'small' : ''}`}>
      {userImage ? (
        <div className={`visual-frame photo ${posClass}`}>
          <img src={userImage} alt={word.en} />
          <span className="visual-badge">
            <EmojiArt emoji={word.emoji} />
          </span>
        </div>
      ) : (
        <div className={`visual-frame ${posClass}`}>
          <EmojiArt emoji={word.emoji} />
        </div>
      )}
      {editable && (
        <div className="visual-actions">
          <button type="button" className="link-btn" onClick={() => fileRef.current?.click()}>
            📷 {userImage ? 'Görseli değiştir' : 'Kendi görselini ekle'}
          </button>
          {userImage && (
            <button type="button" className="link-btn" onClick={() => removeUserImage(word.id)}>
              Kaldır
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) setError((await setUserImage(word.id, f)) ?? '');
            }}
          />
        </div>
      )}
      {error && <p className="small error">{error}</p>}
    </div>
  );
}
