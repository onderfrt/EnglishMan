import { useState } from 'react';
import { LEVEL_ORDER, LEVELS, WORDS, type Level } from '../data/words';
import type { Progress } from '../lib/storage';
import { useBack } from '../lib/back';
import { PlacementTest } from './PlacementTest';

interface Props {
  progress: Progress;
  onSelect: (level: Level) => void;
  onCancel?: () => void;
  onChangeGoal: () => void;
}

export function LevelPicker({ progress, onSelect, onCancel, onChangeGoal }: Props) {
  const [testing, setTesting] = useState(false);
  const current = progress.settings.level;
  useBack(testing, () => setTesting(false));

  if (testing) {
    return <PlacementTest onDone={onSelect} onCancel={() => setTesting(false)} />;
  }

  return (
    <div className="level-picker">
      <div className="card">
        <h2>{current ? 'Seviyeni değiştir' : 'Hoş geldin! 👋'}</h2>
        <p className="muted">
          Yeni kelimeler seçtiğin seviyeden gelir. Daha önce öğrendiğin kelimelerin tekrarları seviye değişse de devam eder.
        </p>
        <button className="btn btn-primary btn-block" onClick={() => setTesting(true)}>
          🧭 Seviyemi bilmiyorum, kısa bir test yapalım
        </button>
        <button className="btn btn-block" onClick={onChangeGoal}>
          🎯 Sınava mı hazırlanıyorsun? Hedefi değiştir (YDS, YÖKDİL, IELTS)
        </button>
      </div>
      <div className="levels">
        {LEVEL_ORDER.map((level) => {
          const words = WORDS.filter((w) => w.level === level);
          const seen = words.filter((w) => progress.cards[w.id]).length;
          return (
            <button
              key={level}
              className={`level-card ${level === current ? 'selected' : ''}`}
              onClick={() => onSelect(level)}
            >
              <span className={`level-code lvl-${level}`}>{level}</span>
              <span className="level-text">
                <b>{LEVELS[level].name}</b>
                <span className="muted small">{LEVELS[level].description}</span>
              </span>
              <span className="muted small">
                {seen}/{words.length}
              </span>
            </button>
          );
        })}
      </div>
      {onCancel && (
        <button className="btn btn-block" onClick={onCancel}>
          Vazgeç
        </button>
      )}
    </div>
  );
}
