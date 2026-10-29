import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Home } from './components/Home';
import { Intro, introSeen } from './components/Intro';
import { NavIcon } from './components/NavIcon';
import { Practice } from './components/Practice';
import { GoalPicker } from './components/GoalPicker';
import { LevelPicker } from './components/LevelPicker';
import { SessionView, type SessionKind } from './components/SessionView';
import { SettingsView } from './components/SettingsView';
import { AuthScreen } from './components/AuthScreen';
import { BackBar } from './components/BackBar';
import { SyncBadge } from './components/SyncBadge';
import { WordsHelp } from './components/WordsHelp';
import { WordsTab, type WordsView } from './components/WordsTab';
import type { Filter } from './components/WordList';
import { GOALS, type Goal, type Level, type Word } from './data/words';
import type { TypedResult } from './lib/answer';
import { useBack } from './lib/back';
import { setCustomWords } from './lib/catalog';
import { removeUserImages } from './lib/images';
import { dismissRecovery, initSync, scheduleSync, useSync } from './lib/sync/engine';
import { sameJSON } from './lib/sync/merge';
import { buildSession, examSession, practiceSession, type OwnList, type SessionOptions, type Step } from './lib/session';
import { looksPhrasal } from './lib/phrasal';
import { WordActionsContext, type WordActions } from './lib/wordActions';
import { setPreferredVoice } from './lib/speech';
import { newCard, review, type CardState, type Grade } from './lib/srs';
import { dayKey, isKnown, loadProgress, saveProgress, type Progress, type Theme } from './lib/storage';

type Tab = 'home' | 'words' | 'practice' | 'settings';

const TABS: [Tab, string][] = [
  ['home', 'Ana sayfa'],
  ['words', 'Kelimeler'],
  ['practice', 'Alıştırma'],
  ['settings', 'Profil'],
];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

const GRADE: Record<TypedResult, Grade> = { correct: 'good', typo: 'hard', wrong: 'again' };

export default function App() {
  const [progress, setProgressState] = useState<Progress>(loadProgress);
  // Her zaman güncel ilerleme: eşitleme motoru React'in bir sonraki çizimini beklemeden okuyabilsin.
  const progressRef = useRef(progress);
  const setProgress = useCallback((next: Progress | ((p: Progress) => Progress)) => {
    const value = typeof next === 'function' ? next(progressRef.current) : next;
    if (value === progressRef.current) return;
    progressRef.current = value;
    setProgressState(value);
  }, []);
  const [tab, setTab] = useState<Tab>('home');
  const [wordsView, setWordsView] = useState<WordsView>('builtin');
  // Kendi kelimeler tüm uygulamada (oturum, sorular, listeler) görünür olsun.
  setCustomWords(progress.customWords);
  const [session, setSession] = useState<{ steps: Step[]; kind: SessionKind } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [picking, setPicking] = useState<'goal' | 'level' | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  // İlk açılışta kısa tanıtım (Profil'den yeniden açılabilir).
  const [intro, setIntro] = useState(() => !progress.settings.goal && !introSeen());
  // Ana sayfadaki hızlı ekleme: Kelimelerim'de bu kelimeyle doldurulmuş form açılır.
  const [quickAdd, setQuickAdd] = useState<{ en: string; n: number } | null>(null);
  // Kelimeler sekmesine belirli bir durum süzgeciyle gelmek için (her gelişte liste yeniden kurulur).
  const [wordsFilter, setWordsFilter] = useState<{ filter: Filter; n: number } | null>(null);
  const sync = useSync();

  useEffect(() => saveProgress(progress), [progress]);

  // Hesap ve cihazlar arası eşitleme (yapılandırılmamışsa hiçbir şey yapmaz).
  useEffect(() => {
    void initSync({
      getLocal: () => progressRef.current,
      // Sunucudan gelen birleştirme gerçekten bir şey değiştirmediyse durumu yenileme (sonsuz eşitlemeyi önler).
      applyLocal: (fn) => setProgress((p) => {
        const next = fn(p);
        return sameJSON(next, p) ? p : next;
      }),
    });
  }, [setProgress]);
  useEffect(() => scheduleSync(), [progress]);

  // Ayarlar değişince zamanını kaydet (eşitlemede en son değiştirilen ayarlar kazanır). İlk açılışta değil.
  const lastSettings = useRef(progress.settings);
  useEffect(() => {
    if (lastSettings.current === progress.settings) return;
    lastSettings.current = progress.settings;
    setProgress((p) => ({ ...p, settingsUpdatedAt: Date.now() }));
  }, [progress.settings, setProgress]);
  useEffect(() => setPreferredVoice(progress.settings.voiceURI), [progress.settings.voiceURI]);
  useEffect(() => applyTheme(progress.settings.theme), [progress.settings.theme]);

  // Sayfa açık kalırsa "tekrar zamanı gelen" sayısı güncel kalsın.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const start = (opts: SessionOptions) => {
    const steps = buildSession(progress, Date.now(), opts);
    if (steps.length) setSession({ steps, kind: 'study' });
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

  const ungrade = (wordId: string, before: CardState | undefined, result: TypedResult) => {
    const key = dayKey(Date.now());
    setProgress((p) => {
      const cards = { ...p.cards };
      if (before) cards[wordId] = before;
      else delete cards[wordId];
      const day = p.days[key];
      const days = day
        ? {
            ...p.days,
            [key]: {
              reviews: Math.max(0, day.reviews - 1),
              correct: Math.max(0, day.correct - (result === 'wrong' ? 0 : 1)),
              newLearned: Math.max(0, day.newLearned - (before ? 0 : 1)),
            },
          }
        : p.days;
      return { ...p, cards, days };
    });
  };

  const saveCustomWord = (word: Word) =>
    setProgress((p) => ({
      ...p,
      customWords: p.customWords.some((w) => w.id === word.id)
        ? p.customWords.map((w) => (w.id === word.id ? word : w))
        : [...p.customWords, word],
    }));

  const deleteCustomWords = (ids: string[]) => {
    const gone = new Set(ids);
    removeUserImages(ids);
    setProgress((p) => {
      const keep = <T,>(rec: Record<string, T>) => Object.fromEntries(Object.entries(rec).filter(([id]) => !gone.has(id)));
      const at = Date.now();
      return {
        ...p,
        cards: keep(p.cards),
        notes: keep(p.notes),
        favorites: keep(p.favorites),
        known: keep(p.known),
        customWords: p.customWords.filter((w) => !gone.has(w.id)),
        // Diğer cihazlardan eşitlemede geri gelmesin
        deleted: { ...p.deleted, ...Object.fromEntries(ids.map((id) => [id, at])) },
      };
    });
  };

  const importCustomWords = (added: Word[], updated: Word[]) =>
    setProgress((p) => {
      const byId = new Map(updated.map((w) => [w.id, w]));
      return { ...p, customWords: [...p.customWords.map((w) => byId.get(w.id) ?? w), ...added] };
    });

  const setNote = (wordId: string, note: string) =>
    setProgress((p) => {
      const notes = { ...p.notes };
      if (note) notes[wordId] = note;
      else delete notes[wordId];
      return { ...p, notes, noteAt: { ...p.noteAt, [wordId]: Date.now() } };
    });

  const toggleFavorite = (wordId: string) =>
    setProgress((p) => ({
      ...p,
      favorites: { ...p.favorites, [wordId]: { on: !p.favorites[wordId]?.on, at: Date.now() } },
    }));

  const wordActions: WordActions = {
    notes: progress.notes,
    setNote,
    isFavorite: (id) => !!progress.favorites[id]?.on,
    toggleFavorite,
    practice: (words) => {
      const steps = practiceSession(progress, words.map((w) => w.id));
      if (steps.length) setSession({ steps, kind: 'study' });
    },
    isKnown: (id) => isKnown(progress, id),
    setKnown: (ids, on) =>
      setProgress((p) => {
        const at = Date.now();
        return { ...p, known: { ...p.known, ...Object.fromEntries(ids.map((id) => [id, { on, at }])) } };
      }),
    exam: (words) => {
      const steps = examSession(words.map((w) => w.id));
      if (steps.length) setSession({ steps, kind: 'exam' });
    },
  };

  const endSession = () => {
    setSession(null);
    setNow(Date.now());
  };

  // Geri tuşu (ekrandaki ya da telefonunki): oturumdan, seçim ekranlarından ve sekmelerden ana sayfaya döner.
  useBack(tab !== 'home', () => setTab('home'));
  useEffect(() => {
    if (tab !== 'words') {
      setQuickAdd(null);
      setWordsFilter(null);
    }
  }, [tab]);
  useBack(picking !== null, () => setPicking(null));
  useBack(!!session, endSession);
  useBack(intro, () => setIntro(false));

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
  const openList = (list: OwnList) => {
    setWordsView(list === 'phrasal' ? 'phrasal' : 'custom');
    setTab('words');
  };
  const openLogin = () => setAuthOpen(true);
  const header = (
    <header className="app-header">
      <h1 className="brand">
        <span className="brand-mark">E</span>
        EnglishMan
      </h1>
      <SyncBadge onClick={() => (sync.user ? setTab('settings') : openLogin())} />
    </header>
  );
  // Giriş ekranı her ekranın üstünde açılabilir; şifre sıfırlama bağlantısıyla gelinince de açılır.
  const overlay = (authOpen || sync.recovery) && (
    <AuthScreen
      key={sync.recovery ? 'recovery' : 'auth'}
      initialMode={sync.recovery ? 'new-password' : 'signin'}
      onClose={() => {
        setAuthOpen(false);
        dismissRecovery();
      }}
    />
  );
  const withOverlay = (node: ReactNode) => (
    <WordActionsContext.Provider value={wordActions}>
      {node}
      {overlay}
    </WordActionsContext.Provider>
  );

  if (intro) return withOverlay(<Intro onDone={() => setIntro(false)} />);

  // İlk açılış: önce hedef, Genel İngilizce seçildiyse ardından seviye.
  if (!goal || picking === 'goal') {
    return withOverlay(
      <main className="app">
        {goal ? <BackBar title="Hedef" /> : header}
        <GoalPicker
          current={goal}
          examDate={examDate}
          onSelect={setGoal}
          onCancel={goal ? () => setPicking(null) : undefined}
          onLogin={sync.configured && !sync.user ? openLogin : undefined}
        />
      </main>
    );
  }

  if ((goal === 'general' && !level) || picking === 'level') {
    return withOverlay(
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
    return withOverlay(
      <main className="app">
        <SessionView
          initialSteps={session.steps}
          kind={session.kind}
          progress={progress}
          onGrade={grade}
          onUngrade={ungrade}
          onExit={endSession}
        />
      </main>
    );
  }

  return withOverlay(
    <main className="app">
      {tab !== 'home' && (
        <div className="page-head">
          <h1 className="page-title">{tab === 'settings' ? 'Profil' : TABS.find(([id]) => id === tab)![1]}</h1>
          {tab === 'words' && <WordsHelp />}
        </div>
      )}
      {tab === 'home' && (
        <Home
          progress={progress}
          now={now}
          onQuickAdd={(en) => {
            setQuickAdd((q) => ({ en, n: (q?.n ?? 0) + 1 }));
            // "give up" gibi yazılanlar Phrasal verb'lerim'de açılır.
            setWordsView(looksPhrasal(en) ? 'phrasal' : 'custom');
            setTab('words');
          }}
          onOpenPack={() => {
            setWordsFilter((f) => ({ filter: 'all', n: (f?.n ?? 0) + 1 }));
            setWordsView('builtin');
            setTab('words');
          }}
          onStart={start}
          onChangeGoal={() => setPicking('goal')}
          onChangeLevel={() => setPicking('level')}
          onSetLevel={setLevel}
          onOpenList={openList}
        />
      )}
      {tab === 'words' && (
        <WordsTab
          view={wordsView}
          onViewChange={(v) => {
            setWordsView(v);
            setQuickAdd(null); // hızlı ekleme formu yalnızca ilk açılan listede açılır
          }}
          progress={progress}
          now={now}
          level={progress.settings.level ?? (goal && GOALS[goal].pack ? 'B2' : 'B1')}
          onSave={saveCustomWord}
          onDelete={deleteCustomWords}
          onImport={importCustomWords}
          startWith={quickAdd?.en}
          initialFilter={wordsFilter?.filter}
          key={`${quickAdd?.n ?? 0}-${wordsFilter?.n ?? 0}`}
        />
      )}
      {tab === 'practice' && (
        <Practice
          progress={progress}
          onStart={start}
          onOpenList={openList}
        />
      )}
      {tab === 'settings' && (
        <SettingsView
          progress={progress}
          onChange={setProgress}
          onChangeGoal={() => setPicking('goal')}
          onChangeLevel={() => setPicking('level')}
          onLogin={openLogin}
          onShowIntro={() => setIntro(true)}
          now={now}
        />
      )}
      <nav className="tabbar">
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <NavIcon tab={id} />
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
