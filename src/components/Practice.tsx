import { TOPICS, type TopicId } from '../data/words';
import { sourceWords, unseenWords, type SessionOptions } from '../lib/session';
import type { Progress } from '../lib/storage';
import { EmojiArt } from './EmojiArt';

interface GridProps {
  progress: Progress;
  onStart: (opts: SessionOptions) => void;
  /** Yalnızca ilk n konuyu göster (ana sayfa için); bitmemiş konular öne alınır. */
  limit?: number;
}

/** Konu kartları: her biri o konudan 4 yeni kelimelik bir oturum başlatır. */
export function TopicGrid({ progress, onStart, limit }: GridProps) {
  const sourceList = sourceWords(progress);
  const topics = (Object.keys(TOPICS) as TopicId[])
    .map((id) => {
      const total = sourceList.filter((w) => w.topic === id).length;
      const left = total ? unseenWords(progress, id).length : 0;
      return { id, total, left, seen: total - left };
    })
    .filter((t) => t.total > 0);
  const shown = limit ? [...topics].sort((a, b) => Number(a.left === 0) - Number(b.left === 0)).slice(0, limit) : topics;

  return (
    <div className="topics">
      {shown.map(({ id, total, left, seen }) => (
        <button
          key={id}
          className="topic"
          disabled={left === 0}
          onClick={() => onStart({ topic: id, extraNew: Math.min(4, left) })}
          title={left ? `${TOPICS[id].name}: 4 yeni kelime çalış` : 'Bu konudaki tüm kelimeleri öğrendin'}
        >
          <span className="icon-box">
            <EmojiArt emoji={TOPICS[id].emoji} />
          </span>
          <span className="topic-name">{TOPICS[id].name}</span>
          <span className="muted small">
            {seen}/{total} kelime
          </span>
          <span className="topic-bar">
            <span style={{ width: `${(seen / total) * 100}%` }} />
          </span>
        </button>
      ))}
    </div>
  );
}

interface Props {
  progress: Progress;
  onStart: (opts: SessionOptions) => void;
}

/** Alıştırma sekmesi: konuya göre çalışma, ekstra yeni kelime ve yöntemin açıklaması. */
export function Practice({ progress, onStart }: Props) {
  const left = unseenWords(progress).length;
  return (
    <div className="practice">
      {left > 0 && (
        <button className="card custom-cta" onClick={() => onStart({ extraNew: Math.min(4, left) })}>
          <span className="icon-box">
            <EmojiArt emoji="✨" />
          </span>
          <span>
            <b>+4 yeni kelime</b>
            <span className="muted small">Günlük limitine takılmadan biraz daha öğren.</span>
          </span>
          <span className="muted">›</span>
        </button>
      )}

      <h3>Konular</h3>
      <TopicGrid progress={progress} onStart={onStart} />

      <details className="card tips">
        <summary>Bu uygulama nasıl çalışıyor?</summary>
        <ul>
          <li>
            <b>Aralıklı tekrar:</b> Doğru bildiğin kelimeler giderek daha uzun aralıklarla (1 gün → 3 gün → 1 hafta → ...)
            sorulur, yanlış bildiklerin hemen geri gelir. Böylece unutmak üzereyken hatırlarsın ve kelime kalıcı olur.
          </li>
          <li>
            <b>Görsel çağrışım:</b> Her kelime bir görselle eşleşir; soyut kelimelerde birkaç görsel bir sahne anlatır (ör.{' '}
            <i>quit</i> = işe el sallamak). Beyin resimleri kelimelerden çok daha kolay hatırlar.
          </li>
          <li>
            <b>Renk kodu:</b> Görselin arka planı kelime türünü gösterir: <span className="pos-chip pos-noun">isim</span>{' '}
            <span className="pos-chip pos-verb">fiil</span> <span className="pos-chip pos-adjective">sıfat</span>{' '}
            <span className="pos-chip pos-phrasal-verb">deyimsel fiil</span> <span className="pos-chip pos-adverb">zarf</span>{' '}
            <span className="pos-chip pos-conjunction">bağlaç</span> <span className="pos-chip pos-preposition">edat</span>
          </li>
          <li>
            <b>Eş anlamlılar:</b> Akademik kelimelerin eş anlamlılarını da öğrenirsin. YDS ve YÖKDİL'de aynı anlam çoğu zaman
            başka kelimelerle verilir; eş anlamlıları bilmek okuma ve çeviri sorularında büyük avantaj sağlar.
          </li>
          <li>
            <b>Kendi görselin:</b> Bir kelimeye kendi fotoğrafını ya da çizimini ekleyebilirsin. Kendi seçtiğin resim en güçlü
            bağı kurar.
          </li>
          <li>
            <b>Aktif hatırlama:</b> Sadece okumak yerine cevabı kendin bulursun; önce tanıma, sonra yazma ve dinleme.
          </li>
          <li>
            <b>Bağlam ve ses:</b> Kelimeyi bir cümle içinde görür ve doğru telaffuzunu dinlersin.
          </li>
          <li>
            <b>Kendi çağrışımın:</b> Yeni kelimeye kendi notunu ekle; kendi kurduğun bağ en güçlüsüdür.
          </li>
        </ul>
      </details>
    </div>
  );
}
