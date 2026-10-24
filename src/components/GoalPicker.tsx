import { useState } from 'react';
import { GOALS, type Goal } from '../data/words';
import { useBack } from '../lib/back';
import { dayKey } from '../lib/storage';
import { EmojiArt } from './EmojiArt';

interface Props {
  current: Goal | null;
  examDate: string | null;
  onSelect: (goal: Goal, examDate: string | null) => void;
  onCancel?: () => void;
  /** Hesap özelliği varsa ve giriş yapılmamışsa: "Zaten hesabım var" bağlantısı. */
  onLogin?: () => void;
}

const ORDER: Goal[] = ['yds', 'yokdil', 'ielts', 'general'];

/** Hedef seçimi. Sınav hedeflerinde ikinci adımda isteğe bağlı sınav tarihi sorulur. */
export function GoalPicker({ current, examDate, onSelect, onCancel, onLogin }: Props) {
  const [exam, setExam] = useState<Goal | null>(null);
  const [date, setDate] = useState(examDate ?? '');
  useBack(!!exam, () => setExam(null));

  if (exam) {
    return (
      <div className="card">
        <EmojiArt emoji="📅" className="summary-emoji" />
        <h2>{GOALS[exam].name} sınavın ne zaman?</h2>
        <p className="muted">Tarihi girersen ana sayfada kalan günü ve günde kaç yeni kelime öğrenmen gerektiğini gösteririz.</p>
        <input
          type="date"
          className="search"
          value={date}
          min={dayKey(Date.now())}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="btn btn-primary btn-block" onClick={() => onSelect(exam, date || null)} disabled={!date}>
          Devam →
        </button>
        <button className="btn btn-block" onClick={() => onSelect(exam, null)}>
          Henüz bilmiyorum
        </button>
      </div>
    );
  }

  return (
    <div className="level-picker">
      <div className="card">
        <h2>{current ? 'Hedefini değiştir' : 'Hoş geldin! 👋'}</h2>
        <p className="muted">Ne için İngilizce çalışıyorsun? Yeni kelimeler hedefine göre seçilir.</p>
        {onLogin && !current && (
          <button className="btn btn-block" onClick={onLogin}>
            ☁️ Zaten hesabım var, giriş yap
          </button>
        )}
      </div>
      <div className="levels">
        {ORDER.map((goal) => (
          <button
            key={goal}
            className={`level-card ${goal === current ? 'selected' : ''}`}
            onClick={() => (GOALS[goal].pack ? setExam(goal) : onSelect(goal, null))}
          >
            <span className="goal-icon">
              <EmojiArt emoji={GOALS[goal].emoji} />
            </span>
            <span className="level-text">
              <b>{GOALS[goal].name}</b>
              <span className="muted small">{GOALS[goal].description}</span>
            </span>
          </button>
        ))}
      </div>
      {onCancel && (
        <button className="btn btn-block" onClick={onCancel}>
          Vazgeç
        </button>
      )}
    </div>
  );
}
