import { LEVELS, TOPICS, WORDS, type Level, type TopicId } from '../data/words';
import { dueCards, newWordsLeftToday, nextLevel, unseenWords, type SessionOptions } from '../lib/session';
import { isMastered } from '../lib/srs';
import { dayKey, streak, type Progress } from '../lib/storage';
import { EmojiArt } from './EmojiArt';

interface Props {
  progress: Progress;
  now: number;
  onStart: (opts: SessionOptions) => void;
  onChangeLevel: () => void;
  onSetLevel: (level: Level) => void;
}

export function Home({ progress, now, onStart, onChangeLevel, onSetLevel }: Props) {
  const level = progress.settings.level!;
  const levelWords = WORDS.filter((w) => w.level === level);
  const levelLeft = unseenWords(progress).length;
  const upcoming = nextLevel(level);
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
      <button className="level-banner" onClick={onChangeLevel}>
        <span className={`level-code lvl-${level}`}>{level}</span>
        <span className="level-text">
          <b>{LEVELS[level].name}</b>
          <span className="topic-bar">
            <span style={{ width: `${((levelWords.length - levelLeft) / levelWords.length) * 100}%` }} />
          </span>
        </span>
        <span className="muted small">
          {levelWords.length - levelLeft}/{levelWords.length} · Değiştir ▾
        </span>
      </button>

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
        ) : levelLeft === 0 ? (
          <>
            <h2>{level} seviyesini tamamladın! 🏆</h2>
            <p className="muted">Bu seviyedeki tüm kelimelerle tanıştın. Tekrarlar zamanı gelince karşına çıkmaya devam edecek.</p>
            {upcoming && (
              <button className="btn btn-primary btn-block" onClick={() => onSetLevel(upcoming)}>
                {upcoming} seviyesine geç →
              </button>
            )}
          </>
        ) : (
          <>
            <h2>Bugünlük bu kadar! 🎉</h2>
            <p className="muted">Tekrar zamanı gelen kelime yok. İstersen birkaç yeni kelime daha öğrenebilirsin.</p>
            <button
              className="btn btn-block"
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
          const total = levelWords.filter((w) => w.topic === id).length;
          if (total === 0) return null;
          const left = unseenWords(progress, id).length;
          const seen = total - left;
          return (
            <button
              key={id}
              className="topic"
              disabled={left === 0}
              onClick={() => onStart({ topic: id, extraNew: Math.min(4, left) })}
              title={left ? `${TOPICS[id].name}: 4 yeni kelime çalış` : 'Bu konudaki tüm kelimeleri öğrendin'}
            >
              <EmojiArt emoji={TOPICS[id].emoji} className="topic-emoji" />
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
            <b>Görsel çağrışım:</b> Her kelime bir görselle eşleşir; soyut kelimelerde birkaç görsel bir sahne anlatır (ör. <i>quit</i> =
            işe el sallamak). Beyin resimleri kelimelerden çok daha kolay hatırlar.
          </li>
          <li>
            <b>Renk kodu:</b> Görselin arka planı kelime türünü gösterir: <span className="pos-chip pos-noun">isim</span>{' '}
            <span className="pos-chip pos-verb">fiil</span> <span className="pos-chip pos-adjective">sıfat</span>{' '}
            <span className="pos-chip pos-phrasal-verb">deyimsel fiil</span> <span className="pos-chip pos-adverb">zarf</span>
          </li>
          <li>
            <b>Kendi görselin:</b> Bir kelimeye kendi fotoğrafını ya da çizimini ekleyebilirsin. Kendi seçtiğin resim en güçlü bağı kurar.
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
