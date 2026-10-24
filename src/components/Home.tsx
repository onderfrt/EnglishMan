import { useState, type FormEvent } from 'react';
import { GOALS, LEVELS, PACKS, type Level } from '../data/words';
import { customWords } from '../lib/catalog';
import { dueCards, newWordsLeftToday, nextLevel, sourceWords, unseenWords, type SessionOptions } from '../lib/session';
import { isMastered } from '../lib/srs';
import { dayKey, daysUntil, streak, type Progress } from '../lib/storage';
import { EmojiArt } from './EmojiArt';
import { TopicGrid } from './Practice';
import { STATUS_LABEL, status } from './WordList';

interface Props {
  progress: Progress;
  now: number;
  /** Başlıktaki yuvarlak profil düğmesinde gösterilecek harf (hesap yoksa 👤). */
  initial: string | null;
  onStart: (opts: SessionOptions) => void;
  onChangeGoal: () => void;
  onChangeLevel: () => void;
  onSetLevel: (level: Level) => void;
  onOpenCustom: () => void;
  onQuickAdd: (en: string) => void;
  onOpenPractice: () => void;
  onOpenProfile: () => void;
}

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function greeting(now: number): string {
  const h = new Date(now).getHours();
  if (h >= 5 && h < 12) return 'Günaydın';
  if (h >= 12 && h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

/** Bu haftanın (Pazartesi–Pazar) günleri: çalışıldı mı, bugün mü, henüz gelmedi mi? */
function thisWeek(progress: Progress, now: number) {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const today = dayKey(now);
  return WEEKDAYS.map((label) => {
    const key = dayKey(d.getTime());
    const future = d.getTime() > now && key !== today;
    d.setDate(d.getDate() + 1);
    return { label, key, done: !!progress.days[key]?.reviews, today: key === today, future };
  });
}

export function Home(props: Props) {
  const { progress, now, initial, onStart, onChangeGoal, onChangeLevel, onSetLevel, onOpenCustom, onQuickAdd } = props;
  const { goal, level, examDate, newPerDay } = progress.settings;
  const [draft, setDraft] = useState('');
  const pack = goal ? GOALS[goal].pack : null;
  const sourceList = sourceWords(progress);
  const sourceLeft = unseenWords(progress).length;
  // Seviye/paket ilerlemesi yalnızca paketin ya da seviyenin kelimelerini sayar (kendi kelimeler hariç).
  const packList = sourceList.filter((w) => !w.custom);
  const packDone = packList.filter((w) => progress.cards[w.id]).length;
  const upcoming = !pack && level ? nextLevel(level) : null;
  const examDays = pack ? daysUntil(examDate, now) : null;
  // Paketi sınava kadar bitirmek için günde kaç yeni kelime gerekir?
  const perDayNeeded = examDays ? Math.ceil(sourceLeft / examDays) : null;
  const due = dueCards(progress, now).length;
  const newLeft = Math.min(newWordsLeftToday(progress, now), sourceLeft);
  const cards = Object.values(progress.cards);
  const mastered = cards.filter(isMastered).length;
  const today = progress.days[dayKey(now)];
  const learnedToday = today?.newLearned ?? 0;
  const days = streak(progress.days, now);
  const total = due + newLeft;
  // Kelime başına ortalama ~20 saniye
  const minutes = Math.max(1, Math.round(total / 3));
  const own = customWords();
  const recent = own.slice(-3).reverse();
  const dateLabel = new Date(now).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  const quickAdd = (e: FormEvent) => {
    e.preventDefault();
    onQuickAdd(draft.trim());
    setDraft('');
  };

  return (
    <div className="home">
      <header className="home-head">
        <div>
          <p className="muted small home-date">{dateLabel}</p>
          <h1>{greeting(now)}</h1>
        </div>
        <div className="home-head-actions">
          {goal && (
            <button className="pill" onClick={pack ? onChangeGoal : onChangeLevel} title={pack ? 'Hedefi değiştir' : 'Seviyeyi değiştir'}>
              <EmojiArt emoji={GOALS[goal].emoji} /> {pack ? GOALS[goal].name : level}
            </button>
          )}
          <button className="avatar" onClick={props.onOpenProfile} aria-label="Profil">
            {initial ?? '👤'}
          </button>
        </div>
      </header>

      <section className="card goal-card">
        <div className="goal-card-top">
          <span className="goal-card-title">Günlük hedef</span>
          {days > 0 && <span className="streak-chip">🔥 {days} gün seri</span>}
        </div>
        <p className="goal-count">
          <b>{Math.min(learnedToday, newPerDay)}</b> / {newPerDay} yeni kelime
        </p>
        <div className="meter">
          <span style={{ width: `${Math.min(1, learnedToday / newPerDay) * 100}%` }} />
        </div>
        <div className="week" aria-label="Bu hafta">
          {thisWeek(progress, now).map((d) => (
            <span key={d.key} className={`week-day${d.done ? ' done' : ''}${d.today ? ' today' : ''}${d.future ? ' future' : ''}`}>
              <i>{d.done ? '✓' : ''}</i>
              {d.label}
            </span>
          ))}
        </div>
        <button className="goal-pack" onClick={pack ? onChangeGoal : onChangeLevel}>
          <span>
            {pack ? PACKS[pack].name : level ? `${level} · ${LEVELS[level].name}` : ''}
            {examDays !== null && (examDays === 0 ? ' · 🎯 Sınav bugün!' : ` · ⏳ Sınava ${examDays} gün`)}
          </span>
          <span className="muted">
            {packDone}/{packList.length} ›
          </span>
        </button>
      </section>
      {perDayNeeded !== null && perDayNeeded > newPerDay && (
        <p className="notice small">
          Paketi sınava kadar bitirmek için günde ~{perDayNeeded} yeni kelime gerekiyor; ayarın {newPerDay}. Profil'den
          artırabilirsin.
        </p>
      )}

      <section className="card review-card">
        {total > 0 ? (
          <>
            <span className="review-kicker">Bugünün çalışması</span>
            <h2>{total} kelime seni bekliyor</h2>
            <p>
              {[due > 0 && `${due} tekrar`, newLeft > 0 && `${newLeft} yeni`].filter(Boolean).join(' + ')} · ~{minutes} dk
            </p>
            <button className="btn btn-on-accent btn-block btn-lg" onClick={() => onStart({})}>
              {due > 0 ? 'Tekrara başla' : 'Başla'}
            </button>
          </>
        ) : sourceLeft === 0 ? (
          <>
            <span className="review-kicker">Tebrikler 🏆</span>
            <h2>{pack ? `${PACKS[pack].name} tamamlandı!` : `${level} seviyesini tamamladın!`}</h2>
            <p>Tüm kelimelerle tanıştın. Tekrarlar zamanı gelince karşına çıkmaya devam edecek.</p>
            {upcoming && (
              <button className="btn btn-on-accent btn-block" onClick={() => onSetLevel(upcoming)}>
                {upcoming} seviyesine geç →
              </button>
            )}
          </>
        ) : (
          <>
            <span className="review-kicker">Bugünlük bu kadar 🎉</span>
            <h2>Tekrar zamanı gelen kelime yok</h2>
            <p>İstersen birkaç yeni kelime daha öğrenebilirsin.</p>
            <button className="btn btn-on-accent btn-block" onClick={() => onStart({ extraNew: 4 })}>
              +4 yeni kelime
            </button>
          </>
        )}
      </section>

      <div className="section-head">
        <h3>Kelimelerim</h3>
        <button className="chip-btn" onClick={onOpenCustom}>
          {own.length ? 'Tümü ›' : '+ Kelime ekle'}
        </button>
      </div>
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
      <div className="tiles">
        <Tile value={cards.length} label="Toplam" />
        <Tile value={cards.length - mastered} label="Öğreniliyor" />
        <Tile value={mastered} label="Kalıcı" />
      </div>
      {recent.length > 0 && (
        <div className="card recent-words">
          {recent.map((w) => {
            const s = status(progress.cards[w.id]);
            return (
              <button key={w.id} className="recent-word" onClick={onOpenCustom}>
                <span>
                  <b>{w.en}</b>
                  <span className="muted small">{w.tr}</span>
                </span>
                <span className={`status status-${s}`}>{STATUS_LABEL[s]}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="section-head">
        <div>
          <h3>Hazır alıştırmalar</h3>
          <p className="muted small">{pack && goal ? `${GOALS[goal].name} hedefine göre seçildi` : `${level} seviyesine göre seçildi`}</p>
        </div>
        <button className="chip-btn" onClick={props.onOpenPractice}>
          Tümü ›
        </button>
      </div>
      <TopicGrid progress={progress} onStart={onStart} limit={4} />
    </div>
  );
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className="tile">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
