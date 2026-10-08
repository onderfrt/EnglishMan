import { TOPICS, WORDS, type TopicId } from '../data/words';
import { dueCards, newWordsLeftToday, unseenWords, type SessionOptions } from '../lib/session';
import { isMastered } from '../lib/srs';
import { dayKey, streak, type Progress } from '../lib/storage';

interface Props {
  progress: Progress;
  now: number;
  onStart: (opts: SessionOptions) => void;
}

export function Home({ progress, now, onStart }: Props) {
  const due = dueCards(progress, now).length;
  const newLeft = Math.min(newWordsLeftToday(progress, now), unseenWords(progress).length);
  const cards = Object.values(progress.cards);
  const learned = cards.length;
  const mastered = cards.filter(isMastered).length;
  const today = progress.days[dayKey(now)];
  const days = streak(progress.days, now);
  const hasWork = due + newLeft > 0;

  return (
    <div className="home">
      <div className="stats">
        <Stat value={`${days}🔥`} label="gün seri" />
        <Stat value={learned} label="öğrenilen" />
        <Stat value={mastered} label="kalıcı" />
        <Stat value={today?.reviews ?? 0} label="bugün tekrar" />
      </div>

      <div className="card hero">
        {hasWork ? (
          <>
            <h2>Bugünün çalışması</h2>
            <p>
              {due > 0 && (
                <span>
                  <b>{due}</b> tekrar
                </span>
              )}
              {due > 0 && newLeft > 0 && ' + '}
              {newLeft > 0 && (
                <span>
                  <b>{newLeft}</b> yeni kelime
                </span>
              )}
            </p>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => onStart({})}>
              Başla ▶
            </button>
          </>
        ) : (
          <>
            <h2>Bugünlük bu kadar! 🎉</h2>
            <p className="muted">Tekrar zamanı gelen kelime yok. İstersen birkaç yeni kelime daha öğrenebilirsin.</p>
            <button
              className="btn btn-block"
              disabled={unseenWords(progress).length === 0}
              onClick={() => onStart({ extraNew: 4 })}
            >
              +4 yeni kelime
            </button>
          </>
        )}
      </div>

      <h3>Konular</h3>
      <div className="topics">
        {(Object.keys(TOPICS) as TopicId[]).map((id) => {
          const total = WORDS.filter((w) => w.topic === id).length;
          const seen = cards.filter((c) => c.wordId.startsWith(`${id}:`)).length;
          const left = unseenWords(progress, id).length;
          return (
            <button
              key={id}
              className="topic"
              disabled={left === 0}
              onClick={() => onStart({ topic: id, extraNew: Math.min(4, left) })}
              title={left ? `${TOPICS[id].name}: 4 yeni kelime çalış` : 'Bu konudaki tüm kelimeleri öğrendin'}
            >
              <span className="topic-emoji">{TOPICS[id].emoji}</span>
              <span className="topic-name">{TOPICS[id].name}</span>
              <span className="topic-bar">
                <span style={{ width: `${(seen / total) * 100}%` }} />
              </span>
              <span className="muted small">
                {seen}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <details className="card tips">
        <summary>Bu uygulama nasıl çalışıyor?</summary>
        <ul>
          <li>
            <b>Aralıklı tekrar:</b> Doğru bildiğin kelimeler giderek daha uzun aralıklarla (1 gün → 3 gün → 1 hafta → ...) sorulur,
            yanlış bildiklerin hemen geri gelir. Böylece unutmak üzereyken hatırlarsın ve kelime kalıcı olur.
          </li>
          <li>
            <b>Görsel çağrışım:</b> Her kelime bir görselle eşleşir. Beyin resimleri kelimelerden çok daha kolay hatırlar.
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

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
