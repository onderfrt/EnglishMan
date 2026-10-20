import { useEffect, useState } from 'react';
import { Home } from './components/Home';
import { GoalPicker } from './components/GoalPicker';
import { LevelPicker } from './components/LevelPicker';
import { SessionView } from './components/SessionView';
import { SettingsView } from './components/SettingsView';
import { BackBar } from './components/BackBar';
import { WordsTab, type WordsView } from './components/WordsTab';
import { GOALS, type Goal, type Level, type Word } from './data/words';
import type { TypedResult } from './lib/answer';
import { useBack } from './lib/back';
import { setCustomWords } from './lib/catalog';
import { removeUserImage } from './lib/images';
import { buildSession, type SessionOptions, type Step } from './lib/session';
import { setPreferredVoice } from './lib/speech';
import { newCard, review, type Grade } from './lib/srs';
import { dayKey, loadProgress, saveProgress, type Progress, type Theme } from './lib/storage';

type Tab = 'home' | 'words' | 'settings';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

const GRADE: Record<TypedResult, Grade> = { correct: 'good', typo: 'hard', wrong: 'again' };

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [tab, setTab] = useState<Tab>('home');
  const [wordsView, setWordsView] = useState<WordsView>('builtin');
  // Kendi kelimeler tüm uygulamada (oturum, sorular, listeler) görünür olsun.
  setCustomWords(progress.customWords);
  const [session, setSession] = useState<Step[] | null>(null);
  const [now, setNow] = useState(Date.now());
  const [picking, setPicking] = useState<'goal' | 'level' | null>(null);

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => setPreferredVoice(progress.settings.voiceURI), [progress.settings.voiceURI]);
  useEffect(() => applyTheme(progress.settings.theme), [progress.settings.theme]);

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

  const saveCustomWord = (word: Word) =>
    setProgress((p) => ({
      ...p,
      customWords: p.customWords.some((w) => w.id === word.id)
        ? p.customWords.map((w) => (w.id === word.id ? word : w))
        : [...p.customWords, word],
    }));

  const deleteCustomWord = (id: string) => {
    removeUserImage(id);
    setProgress((p) => {
      const { [id]: _card, ...cards } = p.cards;
      const { [id]: _note, ...notes } = p.notes;
      return { ...p, cards, notes, customWords: p.customWords.filter((w) => w.id !== id) };
    });
  };

  const importCustomWords = (words: Word[]) =>
    setProgress((p) => ({ ...p, customWords: [...p.customWords, ...words] }));

  const setNote = (wordId: string, note: string) =>
    setProgress((p) => {
      const notes = { ...p.notes };
      if (note) notes[wordId] = note;
      else delete notes[wordId];
      return { ...p, notes };
    });

  const endSession = () => {
    setSession(null);
    setNow(Date.now());
  };

  // Geri tuşu (ekrandaki ya da telefonunki): oturumdan, seçim ekranlarından ve sekmelerden ana sayfaya döner.
  useBack(tab !== 'home', () => setTab('home'));
  useBack(picking !== null, () => setPicking(null));
  useBack(!!session, endSession);

  const setLevel = (level: Level) => {
    setProgress((p) => ({ ...p, settings: { ...p.settings, level } }));
    setPicking(null);
    setTab('home');
  };

  const setGoal = (goal: Goal | null, examDate: string | null = null) => {
    setProgress((p) => ({ ...p, settings: { ...p.settings, goal, examDate } }));
    setPicking(null);
    setTab('home');
  };

  const { goal, level, examDate } = progress.settings;
  const header = (
    <header className="app-header">
      <h1>
        English<span>Man</span>
      </h1>
    </header>
  );

  // İlk açılış: önce hedef, Genel İngilizce seçildiyse ardından seviye.
  if (!goal || picking === 'goal') {
    return (
      <main className="app">
        {goal ? <BackBar title="Hedef" /> : header}
        <GoalPicker
          current={goal}
          examDate={examDate}
          onSelect={setGoal}
          onCancel={goal ? () => setPicking(null) : undefined}
        />
      </main>
    );
  }

  if ((goal === 'general' && !level) || picking === 'level') {
    return (
      <main className="app">
        {level ? <BackBar title="Seviye" /> : header}
        <LevelPicker
          progress={progress}
          onSelect={setLevel}
          onCancel={level ? () => setPicking(null) : () => setGoal(null)}
          onChangeGoal={() => setPicking('goal')}
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
          onExit={endSession}
        />
      </main>
    );
  }

  return (
    <main className="app">
      {tab === 'home' ? header : <BackBar title={tab === 'words' ? 'Kelimeler' : 'Ayarlar'} />}
      {tab === 'home' && (
        <Home
          progress={progress}
          now={now}
          onStart={start}
          onChangeGoal={() => setPicking('goal')}
          onChangeLevel={() => setPicking('level')}
          onSetLevel={setLevel}
          onOpenCustom={() => {
            setWordsView('custom');
            setTab('words');
          }}
        />
      )}
      {tab === 'words' && (
        <WordsTab
          view={wordsView}
          onViewChange={setWordsView}
          progress={progress}
          now={now}
          level={progress.settings.level ?? (goal && GOALS[goal].pack ? 'B2' : 'B1')}
          onSave={saveCustomWord}
          onDelete={deleteCustomWord}
          onImport={importCustomWords}
        />
      )}
      {tab === 'settings' && (
        <SettingsView
          progress={progress}
          onChange={setProgress}
          onChangeGoal={() => setPicking('goal')}
          onChangeLevel={() => setPicking('level')}
        />
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
