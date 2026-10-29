import { useState, type FormEvent } from 'react';
import { GOALS, LEVELS, PACKS, TOPICS, type Level, type TopicId } from '../data/words';
import { customWords } from '../lib/catalog';
import { dueCards, newWordsLeftToday, nextLevel, sourceWords, unseenWords, type SessionOptions } from '../lib/session';
import { isMastered } from '../lib/srs';
import { dayKey, daysUntil, isKnown, streak, type Progress } from '../lib/storage';
import { EmojiArt } from './EmojiArt';

interface Props {
  progress: Progress;
  now: number;
  onStart: (opts: SessionOptions) => void;
  onChangeGoal: () => void;
  onChangeLevel: () => void;
  onSetLevel: (level: Level) => void;
  /** Hazır kelimeler listesini öğrenilen kelimelere süzülmüş olarak açar. */
  onOpenLearned: () => void;
  onOpenCustom: () => void;
  onQuickAdd: (en: string) => void;
}

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function greeting(now: number): string {
  const h = new Date(now).getHours();
  if (h >= 5 && h < 12) return 'Günaydın';
  if (h >= 12 && h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

/** Bu haftanın (Pazartesi–Pazar) günleri: çalışıldı mı, bugün mü? */
function thisWeek(progress: Progress, now: number) {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const today = dayKey(now);
  return WEEKDAYS.map((label) => {
    const key = dayKey(d.getTime());
    d.setDate(d.getDate() + 1);
    return { label, key, done: !!progress.days[key]?.reviews, today: key === today };
  });
}

const minutesFor = (n: number) => Math.max(1, Math.round(n / 3)); // kelime başına ~20 sn

export function Home(props: Props) {
  const { progress, now, onStart, onChangeGoal, onChangeLevel, onSetLevel } = props;
  const { goal, level, examDate, newPerDay } = progress.settings;
  const [draft, setDraft] = useState('');
  const pack = goal ? GOALS[goal].pack : null;
  const sourceList = sourceWords(progress);
  const sourceLeft = unseenWords(progress).length;
  // Paket/seviye ilerlemesi yalnızca paketin ya da seviyenin kelimelerini sayar (kendi kelimeler hariç).
  const packList = sourceList.filter((w) => !w.custom);
  const packDone = packList.filter((w) => progress.cards[w.id]).length;
  const upcoming = !pack && level ? nextLevel(level) : null;
  const examDays = pack ? daysUntil(examDate, now) : null;
  const perDayNeeded = examDays ? Math.ceil(sourceLeft / examDays) : null;
  const due = dueCards(progress, now).length;
  const newLeft = Math.min(newWordsLeftToday(progress, now), sourceLeft);
  const learnedToday = progress.days[dayKey(now)]?.newLearned ?? 0;
  const days = streak(progress.days, now);
  const total = due + newLeft;
  const own = customWords();
  const ownKnown = own.filter((w) => isKnown(progress, w.id)).length;
  const ownActive = own.filter((w) => progress.cards[w.id] && !isKnown(progress, w.id));
  const ownLearning = ownActive.filter((w) => !isMastered(progress.cards[w.id])).length;
  const ownMastered = ownActive.length - ownLearning;
  // Sıradaki konu: içinde henüz öğrenilmemiş kelime olan ilk konu.
  const nextTopic = (Object.keys(TOPICS) as TopicId[])
    .map((id) => ({ id, left: unseenWords(progress, id).filter((w) => !w.custom).length }))
    .find((t) => t.left > 0);
  const dateLabel = new Date(now).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

  const quickAdd = (e: FormEvent) => {
    e.preventDefault();
    props.onQuickAdd(draft.trim());
    setDraft('');
  };

  let title: string;
  let subtitle: string;
  let action: { label: string; run: () => void } | null;
  if (total > 0) {
    title = `${total} kelime seni bekliyor`;
    subtitle = `${[due > 0 && `${due} tekrar`, newLeft > 0 && `${newLeft} yeni`].filter(Boolean).join(' + ')} · ~${minutesFor(total)} dk`;
    action = { label: due > 0 ? 'Tekrara başla' : 'Başla', run: () => onStart({}) };
  } else if (sourceLeft === 0) {
    title = pack ? `${PACKS[pack].name} tamamlandı! 🏆` : `${level} seviyesini tamamladın! 🏆`;
    subtitle = 'Tüm kelimelerle tanıştın. Tekrarlar zamanı gelince karşına çıkacak.';
    action = upcoming ? { label: `${upcoming} seviyesine geç →`, run: () => onSetLevel(upcoming) } : null;
  } else {
    title = 'Tekrar zamanı gelen kelime yok';
    subtitle =
      learnedToday >= newPerDay
        ? `Günlük hedefini tamamladın: ${learnedToday}/${newPerDay} yeni kelime.`
        : 'Bugünlük bu kadar. İstersen birkaç yeni kelime daha öğren.';
    action = { label: '+4 yeni kelime öğren', run: () => onStart({ extraNew: 4 }) };
  }

  return (
    <div className="home">
      <header className="home-head">
        <div>
          <p className="muted small home-date">{dateLabel}</p>
          <h1>{greeting(now)}</h1>
        </div>
        {goal && (
          <button className="pill" onClick={pack ? onChangeGoal : onChangeLevel} title={pack ? 'Hedefi değiştir' : 'Seviyeyi değiştir'}>
            <EmojiArt emoji={GOALS[goal].emoji} /> {pack ? GOALS[goal].name : level}
          </button>
        )}
      </header>

      <section className="card today-card">
        <div className="today-top">
          <span>Bugün</span>
          {days > 0 && <span className="streak-chip">🔥 {days} gün seri</span>}
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="week" aria-label="Bu hafta çalıştığın günler">
          {thisWeek(progress, now).map((d) => (
            <span key={d.key} className={`week-day${d.done ? ' done' : ''}${d.today ? ' today' : ''}`}>
              <i>{d.done ? '✓' : ''}</i>
              {d.label}
            </span>
          ))}
        </div>
        {action && (
          <button className="btn btn-on-accent btn-block btn-lg" onClick={action.run}>
            {action.label}
          </button>
        )}
      </section>

      <form className="quick-add" onSubmit={quickAdd}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Yeni kelime yaz, Enter'a bas"
          aria-label="Yeni kelime"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
        />
        <button type="submit" aria-label="Kelime ekle">
          +
        </button>
      </form>

      <div className="card list-card">
        <button className="list-row" onClick={props.onOpenLearned}>
          <span className="icon-box">
            <EmojiArt emoji={pack ? '🎓' : '📚'} />
          </span>
          <span className="list-text">
            <span className="muted small">
              Öğrendiklerin
              {examDays !== null && (examDays === 0 ? ' · 🎯 Sınav bugün!' : ` · ⏳ Sınava ${examDays} gün`)}
            </span>
            <b>{pack ? PACKS[pack].name : level ? `${level} · ${LEVELS[level].name}` : ''}</b>
            <span className="meter thin">
              <span style={{ width: `${packList.length ? (packDone / packList.length) * 100 : 0}%` }} />
            </span>
          </span>
          <span className="list-count">{packDone}/{packList.length} ›</span>
        </button>
        <button className="list-row" onClick={props.onOpenCustom}>
          <span className="icon-box">
            <EmojiArt emoji="✍️" />
          </span>
          <span className="list-text">
            <b>Kelimelerim</b>
            <span className="muted small">
              {own.length
                ? [`${own.length} kelime`, `${ownLearning} öğreniliyor`, ownMastered && `${ownMastered} kalıcı`, ownKnown && `${ownKnown} öğrendim`]
                    .filter(Boolean)
                    .join(' · ')
                : 'Kendi kelimelerini ekle'}
            </span>
          </span>
          <span className="chev">›</span>
        </button>
        {nextTopic && (
          <button className="list-row" onClick={() => onStart({ topic: nextTopic.id, extraNew: Math.min(4, nextTopic.left) })}>
            <span className="icon-box">
              <EmojiArt emoji={TOPICS[nextTopic.id].emoji} />
            </span>
            <span className="list-text">
              <b>Sıradaki konu: {TOPICS[nextTopic.id].name}</b>
              <span className="muted small">
                {Math.min(4, nextTopic.left)} yeni kelime · ~{minutesFor(Math.min(4, nextTopic.left) * 2)} dk
              </span>
            </span>
            <span className="chev">›</span>
          </button>
        )}
      </div>
      {perDayNeeded !== null && perDayNeeded > newPerDay && (
        <p className="notice small">
          Paketi sınava kadar bitirmek için günde ~{perDayNeeded} yeni kelime gerekiyor; ayarın {newPerDay}. Profil'den
          artırabilirsin.
        </p>
      )}
    </div>
  );
}
