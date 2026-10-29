import { useState } from 'react';
import { useBack } from '../lib/back';
import { EmojiArt } from './EmojiArt';

// Anlatılan özellikler değişince sürüm artar; "yeni" noktası yeniden görünür.
const SEEN_KEY = 'englishman:words-help-seen:v3';

function seen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

const TIPS: { emoji: string; title: string; text: string }[] = [
  {
    emoji: '🧩',
    title: 'Phrasal verb’lerim',
    text: 'Phrasal verb’ler için ayrı bir liste: give up, put off, look forward to… Yazmaya başlayınca öneriler ve anlamları çıkar; toplu ekleme, ✓, ♡ ve sınav Kelimelerim’deki gibi çalışır. Ana sayfaya “give up” gibi yazarsan doğrudan buraya eklenir.',
  },
  {
    emoji: '✅',
    title: 'Öğrendim işareti',
    text: 'Kartın sol üstündeki ✓ ile kelimeyi Öğrendiklerine gönder. Hazır kelimelerde “bunu zaten biliyorum” demektir: kelime sana öğretilmez. Bu kelimeler günlük tekrarlarda da çıkmaz. Fikrini değiştirirsen ✓’ye yeniden dokunman yeter.',
  },
  {
    emoji: '☑️',
    title: 'Toplu işaretle',
    text: 'Hazır kelimelerde ya da Kelimelerim’de “☑️ Seç”e dokun, kelimeleri seç ve “✓ Öğrendim” de (ör. bildiğin A1 kelimelerinin hepsi). Hepsi zaten Öğrendiklerindeyse aynı düğme onları geri çıkarır.',
  },
  {
    emoji: '📝',
    title: 'Kendini sına',
    text: 'Öğrendiklerim filtresinde “Kendini sına” ile istediğin zaman en fazla 20 soruluk karışık bir sınav yap. Sınav tekrar planını değiştirmez; bilemediğin kelimeleri tek dokunuşla yeniden öğrenmeye alabilirsin.',
  },
  {
    emoji: '❤️',
    title: 'Favoriler',
    text: 'Kartın sağ üstündeki ♡ ile kelimeyi favorilere ekle; “♥ Favoriler” filtresiyle hepsini bir arada gör.',
  },
  {
    emoji: '🙈',
    title: 'Önce hatırla ve Quiz',
    text: 'Kartı açınca üstteki 🙈 ile anlamı gizle, önce kendin hatırla. “Quiz ›” baktığın listeden 10 kelimeyle hızlı bir alıştırma başlatır.',
  },
  {
    emoji: '💡',
    title: 'Hafıza ipucu',
    text: 'Her karta kendi ipucunu yaz (ör. abolish → “abla iş”). İpucu kapalı gelir; takılırsan açarsın.',
  },
];

/** Kelimeler başlığının yanındaki ⓘ: bu ekrandaki özellikleri anlatan kısa bilgilendirme. */
export function WordsHelp() {
  const [open, setOpen] = useState(false);
  const [isNew, setIsNew] = useState(() => !seen());
  useBack(open, () => setOpen(false));

  const show = () => {
    setOpen(true);
    setIsNew(false);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Önemli değil: "yeni" noktası bir dahaki açılışta yine görünür.
    }
  };

  return (
    <>
      <button type="button" className="info-btn" onClick={show} aria-label="Kelimeler ekranında neler yapabilirim?" title="Neler yapabilirim?">
        i{isNew && <span className="new-dot" aria-hidden />}
      </button>
      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet help-sheet" role="dialog" aria-modal="true" aria-label="Kelimeler ekranı" onClick={(e) => e.stopPropagation()}>
            <h3>Kelimeler ekranında neler var?</h3>
            <ul>
              {TIPS.map((t) => (
                <li key={t.title}>
                  <span className="icon-box">
                    <EmojiArt emoji={t.emoji} />
                  </span>
                  <span>
                    <b>{t.title}</b>
                    <span className="muted small">{t.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <button className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
}
