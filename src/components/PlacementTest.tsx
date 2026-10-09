import { useMemo, useState } from 'react';
import { LEVEL_ORDER, LEVELS, WORDS, type Level } from '../data/words';
import { choicesFor, shuffle } from '../lib/session';
import { speak } from '../lib/speech';
import { EmojiArt } from './EmojiArt';

/** Her seviyeden 5 kelime sorulur; 4 ve üzeri doğru yapılırsa bir üst seviyeye geçilir. */
const PER_LEVEL = 5;
const PASS = 4;

interface Props {
  onDone: (level: Level) => void;
  onCancel: () => void;
}

export function PlacementTest({ onDone, onCancel }: Props) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [q, setQ] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<Level | null>(null);

  const level = LEVEL_ORDER[levelIndex];
  const questions = useMemo(
    () => shuffle(WORDS.filter((w) => w.level === level)).slice(0, PER_LEVEL),
    [level],
  );
  const word = questions[q];
  const options = useMemo(() => (word ? choicesFor(word) : []), [word]);

  const answer = (ok: boolean) => {
    const total = correct + (ok ? 1 : 0);
    if (q + 1 < PER_LEVEL) {
      setCorrect(total);
      setQ(q + 1);
      return;
    }
    // Seviye bitti: geçtiyse bir sonrakine, geçemediyse bu seviye önerilir.
    if (total >= PASS && levelIndex + 1 < LEVEL_ORDER.length) {
      setLevelIndex(levelIndex + 1);
      setQ(0);
      setCorrect(0);
    } else {
      setResult(level);
    }
  };

  if (result) {
    return (
      <div className="card center">
        <EmojiArt emoji="🎯" className="summary-emoji" />
        <p className="muted">Sana önerdiğimiz seviye</p>
        <div className={`level-code big lvl-${result}`}>{result}</div>
        <h2>{LEVELS[result].name}</h2>
        <p className="muted">{LEVELS[result].description}</p>
        <button className="btn btn-primary btn-block" onClick={() => onDone(result)}>
          Bu seviyeyle başla
        </button>
        <button className="btn btn-block" onClick={onCancel}>
          Kendim seçeceğim
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="session-top">
        <button className="link-btn" onClick={onCancel}>
          ✕ Vazgeç
        </button>
        <div className="progress-bar">
          <div style={{ width: `${((levelIndex * PER_LEVEL + q) / (LEVEL_ORDER.length * PER_LEVEL)) * 100}%` }} />
        </div>
        <span className={`level-code lvl-${level}`}>{level}</span>
      </div>
      <p className="prompt">Bu kelimenin anlamı ne? Bilmiyorsan tahmin etme, “Bilmiyorum” de.</p>
      <div className="question">
        <div className="word-line">
          <span className="word-en">{word.en}</span>
          <button className="icon-btn" onClick={() => speak(word.en)} aria-label="Dinle">
            🔊
          </button>
        </div>
      </div>
      <div className="options">
        {options.map((o, i) => (
          <button key={`${word.id}-${o.id}`} className="option" onClick={() => answer(o.id === word.id)}>
            <span className="opt-key">{i + 1}</span>
            {o.tr}
          </button>
        ))}
        <button className="option option-skip" onClick={() => answer(false)}>
          🤷 Bilmiyorum
        </button>
      </div>
    </div>
  );
}
