import { useRef, useState } from 'react';
import { EmojiArt } from './EmojiArt';

const SEEN_KEY = 'englishman:intro-seen';

export function introSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true; // Depolama kapalıysa her açılışta göstermeyelim.
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Önemli değil: tanıtım bir sonraki açılışta yine görünür.
  }
}

const SLIDES: { emoji: string; title: string; text: string }[] = [
  {
    emoji: '👋',
    title: "EnglishMan'e hoş geldin",
    text: 'YDS, YÖKDİL, IELTS ve günlük İngilizce için kelime öğren. Günde birkaç dakika yeterli.',
  },
  {
    emoji: '🧠',
    title: 'Unutmadan öğren',
    text: 'Bildiğin kelimeler giderek daha seyrek, zorlandıkların daha sık karşına çıkar. Her kelimeyi tam unutmak üzereyken tekrar edersin.',
  },
  {
    emoji: '🖼️',
    title: 'Görsel ve hafıza ipucu',
    text: 'Her kelimenin bir görseli, sesi ve örnek cümlesi var. Kendi fotoğrafını ve “abolish → abla iş” gibi hafıza ipucunu ekleyebilirsin.',
  },
  {
    emoji: '✍️',
    title: 'Kendi kelimelerin',
    text: 'Kitapta, dizide ya da deneme sınavında gördüğün kelimeleri ekle ya da listeden toplu yükle. Hesap açarsan her cihazında seninle olur.',
  },
];

/** İlk açılışta uygulamayı birkaç kısa sayfada anlatan tanıtım. Profil'den yeniden açılabilir. */
export function Intro({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const touchX = useRef<number | null>(null);
  const last = page === SLIDES.length - 1;
  const slide = SLIDES[page];

  const finish = () => {
    markSeen();
    onDone();
  };
  const go = (d: number) => setPage((p) => Math.min(SLIDES.length - 1, Math.max(0, p + d)));

  return (
    <div
      className="intro"
      role="dialog"
      aria-modal="true"
      aria-label="Uygulama tanıtımı"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="intro-top">
        <span className="brand">
          <span className="brand-mark">E</span>
          EnglishMan
        </span>
        {!last && (
          <button className="link-btn" onClick={finish}>
            Atla
          </button>
        )}
      </div>

      <div className="intro-slide" key={page}>
        <span className="intro-art">
          <EmojiArt emoji={slide.emoji} />
        </span>
        <h1>{slide.title}</h1>
        <p className="muted">{slide.text}</p>
      </div>

      <div className="intro-dots" aria-label={`${page + 1} / ${SLIDES.length}`}>
        {SLIDES.map((s, i) => (
          <button key={s.title} className={i === page ? 'active' : ''} onClick={() => setPage(i)} aria-label={`${i + 1}. sayfa`} />
        ))}
      </div>
      <button className="btn btn-primary btn-block btn-lg" onClick={() => (last ? finish() : go(1))}>
        {last ? 'Başlayalım' : 'İleri'}
      </button>
    </div>
  );
}
