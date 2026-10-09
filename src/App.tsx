import { useEffect, useState } from 'react';
import { Home } from './components/Home';
import { LevelPicker } from './components/LevelPicker';
import { SessionView } from './components/SessionView';
import { SettingsView } from './components/SettingsView';
import { WordList } from './components/WordList';
import type { Level } from './data/words';
import type { TypedResult } from './lib/answer';
import { buildSession, type SessionOptions, type Step } from './lib/session';
import { newCard, review, type Grade } from './lib/srs';
import { dayKey, loadProgress, saveProgress, type Progress } from './lib/storage';

type Tab = 'home' | 'words' | 'settings';

const GRADE: Record<TypedResult, Grade> = { correct: 'good', typo: 'hard', wrong: 'again' };

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [tab, setTab] = useState<Tab>('home');
  const [session, setSession] = useState<Step[] | null>(null);
  const [now, setNow] = useState(Date.now());
  const [pickingLevel, setPickingLevel] = useState(false);

  useEffect(() => saveProgress(progress), [progress]);

  // Sayfa açık kalırsa "tekrar zamanı gelen" sayısı güncel kalsın.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const start = (opts: SessionOptions) => {
    const steps = buildSession(progress, Date.now(), opts);
    if (steps.length) setSession(steps);
  };

  const grade = (wordId: string, result: TypedResult) => {
    const t = Date.now();
    setProgress((p) => {
      const existing = p.cards[wordId];
      const card = review(existing ?? newCard(wordId, t), GRADE[result], t);
      const key = dayKey(t);
      const day = p.days[key] ?? { reviews: 0, correct: 0, newLearned: 0 };
      return {
        ...p,
        cards: { ...p.cards, [wordId]: card },
        days: {
          ...p.days,
          [key]: {
            reviews: day.reviews + 1,
            correct: day.correct + (result === 'wrong' ? 0 : 1),
            newLearned: day.newLearned + (existing ? 0 : 1),
          },
        },
      };
    });
  };

  const setNote = (wordId: string, note: string) =>
    setProgress((p) => {
      const notes = { ...p.notes };
      if (note) notes[wordId] = note;
      else delete notes[wordId];
      return { ...p, notes };
    });

  const setLevel = (level: Level) => {
    setProgress((p) => ({ ...p, settings: { ...p.settings, level } }));
    setPickingLevel(false);
    setTab('home');
  };

  if (!progress.settings.level || pickingLevel) {
    return (
      <main className="app">
        <header className="app-header">
          <h1>
            English<span>Man</span>
          </h1>
        </header>
        <LevelPicker
          progress={progress}
          onSelect={setLevel}
          onCancel={progress.settings.level ? () => setPickingLevel(false) : undefined}
        />
      </main>
    );
  }

  if (session) {
    return (
      <main className="app">
        <SessionView
          initialSteps={session}
          progress={progress}
          onGrade={grade}
          onNote={setNote}
          onExit={() => {
            setSession(null);
            setNow(Date.now());
          }}
        />
      </main>
    );
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>
          English<span>Man</span>
        </h1>
      </header>
      {tab === 'home' && (
        <Home progress={progress} now={now} onStart={start} onChangeLevel={() => setPickingLevel(true)} onSetLevel={setLevel} />
      )}
      {tab === 'words' && <WordList progress={progress} now={now} />}
      {tab === 'settings' && (
        <SettingsView progress={progress} onChange={setProgress} onChangeLevel={() => setPickingLevel(true)} />
      )}
      <nav className="tabbar">
        {(
          [
            ['home', '🏠', 'Ana Sayfa'],
            ['words', '📚', 'Kelimeler'],
            ['settings', '⚙️', 'Ayarlar'],
          ] as const
        ).map(([id, icon, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
