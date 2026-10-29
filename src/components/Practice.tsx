import { useState } from 'react';
import { GOALS, LEVELS, PACKS, TOPICS, type TopicId } from '../data/words';
import { customWords, wordById } from '../lib/catalog';
import { dueCards, EXAM_MAX, sourceWords, unseenWords, type SessionOptions } from '../lib/session';
import { isKnown, type Progress } from '../lib/storage';
import { useWordActions } from '../lib/wordActions';
import { EmojiArt } from './EmojiArt';

interface Props {
  progress: Progress;
  onStart: (opts: SessionOptions) => void;
  onOpenCustom: () => void;
}

const SHOWN_TOPICS = 6;

/** Alıştırma sekmesi: ekstra yeni kelime, kendi kelimelerin, konular ve yöntemin açıklaması. */
export function Practice({ progress, onStart, onOpenCustom }: Props) {
  const [allTopics, setAllTopics] = useState(false);
  const actions = useWordActions();
  const { goal, level } = progress.settings;
  const pack = goal ? GOALS[goal].pack : null;
  const left = unseenWords(progress).length;
  const own = customWords();
  const ownLeft = unseenWords(progress, undefined, true).length;
  // Çalışılmış ya da "öğrendim" diye işaretlenmiş kendi kelimeler
  const ownSeen = own.length - ownLeft;
  const ownKnown = own.filter((w) => isKnown(progress, w.id));
  const ownDue = dueCards(progress, Date.now()).filter((c) => wordById(c.wordId)?.custom).length;
  const sourceList = sourceWords(progress).filter((w) => !w.custom);
  const topics = (Object.keys(TOPICS) as TopicId[])
    .map((id) => {
      const total = sourceList.filter((w) => w.topic === id).length;
      const seen = sourceList.filter((w) => w.topic === id && progress.cards[w.id]).length;
      return { id, total, seen, left: total - seen };
    })
    .filter((t) => t.total > 0);
  const shown = allTopics ? topics : topics.slice(0, SHOWN_TOPICS);

  return (
    <div className="practice">
      {left > 0 && (
        <button className="card accent-row" onClick={() => onStart({ extraNew: Math.min(4, left) })}>
          <span className="icon-box">
            <EmojiArt emoji="✨" />
          </span>
          <span className="list-text">
            <b>+4 yeni kelime</b>
            <span className="small">Günlük limitine takılmadan biraz daha öğren.</span>
          </span>
          <span className="chev">›</span>
        </button>
      )}

      <div className="card list-card">
        <button
          className="list-row"
          onClick={() => (ownLeft + ownDue > 0 ? onStart({ own: true, extraNew: Math.min(4, ownLeft) }) : onOpenCustom())}
        >
          <span className="icon-box">
            <EmojiArt emoji="✍️" />
          </span>
          <span className="list-text">
            <b>Kendi kelimelerim</b>
            <span className="muted small">
              {own.length === 0
                ? 'Henüz kelime eklemedin'
                : ownLeft + ownDue > 0
                  ? [ownDue && `${ownDue} tekrar`, ownLeft && `${Math.min(4, ownLeft)} yeni`].filter(Boolean).join(' + ') + ' · çalış'
                  : 'Hepsini öğrendin 🎉'}
            </span>
            {own.length > 0 && (
              <span className="meter thin">
                <span style={{ width: `${(ownSeen / own.length) * 100}%` }} />
              </span>
            )}
          </span>
          <span className="list-count">
            {own.length ? `${ownSeen}/${own.length}` : ''} ›
          </span>
        </button>
        {ownKnown.length > 0 && actions && (
          <button className="list-row" onClick={() => actions.exam(ownKnown)}>
            <span className="icon-box">
              <EmojiArt emoji="📝" />
            </span>
            <span className="list-text">
              <b>Öğrendiklerimle kendini sına</b>
              <span className="muted small">
                {ownKnown.length} kelime · {Math.min(EXAM_MAX, ownKnown.length)} soruluk karışık sınav
              </span>
            </span>
            <span className="chev">›</span>
          </button>
        )}
      </div>

      <div className="section-head">
        <h3>Konular</h3>
        <span className="muted small">{pack && goal ? `${GOALS[goal].name} · ${PACKS[pack].name}` : level ? `${level} · ${LEVELS[level].name}` : ''}</span>
      </div>
      <div className="card list-card">
        {shown.map(({ id, total, seen, left: topicLeft }) => (
          <button
            key={id}
            className="list-row"
            disabled={topicLeft === 0}
            onClick={() => onStart({ topic: id, extraNew: Math.min(4, topicLeft) })}
            title={topicLeft ? `${TOPICS[id].name}: 4 yeni kelime çalış` : 'Bu konudaki tüm kelimeleri öğrendin'}
          >
            <span className="icon-box">
              <EmojiArt emoji={TOPICS[id].emoji} />
            </span>
            <span className="list-text">
              <b>{TOPICS[id].name}</b>
            </span>
            <span className="list-count">
              {topicLeft === 0 ? '✓ ' : ''}
              {seen}/{total} ›
            </span>
          </button>
        ))}
        {topics.length > SHOWN_TOPICS && (
          <button className="list-more" onClick={() => setAllTopics(!allTopics)}>
            {allTopics ? 'Daha az göster' : `Tüm konular (${topics.length})`}
          </button>
        )}
      </div>

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
