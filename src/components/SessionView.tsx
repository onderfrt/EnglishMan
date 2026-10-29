import { useState } from 'react';
import { wordById } from '../lib/catalog';
import type { TypedResult } from '../lib/answer';
import { retryMode, type Step } from '../lib/session';
import type { CardState } from '../lib/srs';
import type { Progress } from '../lib/storage';
import { LearnCard } from './LearnCard';
import { EmojiArt } from './EmojiArt';
import { Quiz } from './Quiz';
import { useWordActions } from '../lib/wordActions';

/** study: normal çalışma ya da hızlı quiz; exam: Öğrendiklerimden "Kendini sına". */
export type SessionKind = 'study' | 'exam';

interface Props {
  initialSteps: Step[];
  kind?: SessionKind;
  progress: Progress;
  onGrade: (wordId: string, result: TypedResult) => void;
  /** Bildirilen hatalı soruda verilen yanlış cevabı geri alır. */
  onUngrade: (wordId: string, before: CardState | undefined, result: TypedResult) => void;
  onExit: () => void;
}

/** Yanlış bilinen kelime, araya birkaç soru girdikten sonra tekrar sorulur (en fazla MAX_RETRIES kez). */
const RETRY_GAP = 3;
const MAX_RETRIES = 2;

export function SessionView({ initialSteps, kind = 'study', progress, onGrade, onUngrade, onExit }: Props) {
  const [steps, setSteps] = useState(initialSteps);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ wordId: string; result: TypedResult }[]>([]);
  // Cevaplanan sorudan önceki kart durumu: soru hatalı diye bildirilirse geri yüklemek için.
  const [before, setBefore] = useState<{ index: number; card: CardState | undefined } | null>(null);

  const step = steps[index];
  const graded = steps.filter((s) => s.kind === 'quiz' && s.graded).length;
  const answered = results.length;

  if (!step) {
    return <Summary results={results} exam={kind === 'exam'} onExit={onExit} />;
  }

  const word = wordById(step.wordId)!;
  const next = () => setIndex((i) => i + 1);

  const handleAnswer = (result: TypedResult) => {
    if (step.kind !== 'quiz') return;
    if (step.graded) {
      setBefore({ index, card: progress.cards[step.wordId] });
      onGrade(step.wordId, result);
      setResults((r) => [...r, { wordId: step.wordId, result }]);
    } else if (step.practice) {
      setResults((r) => [...r, { wordId: step.wordId, result }]);
    }
    // Sınavda yanlışlar tekrar sorulmaz; sonuç ekranında topluca gösterilir.
    if (result === 'wrong' && kind !== 'exam') {
      setSteps((s) => {
        const retries = s.filter((x) => x.kind === 'quiz' && !x.graded && x.wordId === step.wordId).length;
        if (retries >= MAX_RETRIES) return s;
        const copy = [...s];
        const at = Math.min(index + 1 + RETRY_GAP, copy.length);
        copy.splice(at, 0, { kind: 'quiz', wordId: step.wordId, mode: retryMode(step.mode), graded: false });
        return copy;
      });
    }
  };

  // Hatalı diye bildirilen soruda yanlış cevap sayılmaz: kart eski hâline döner, tekrar sorusu çıkarılır.
  const handleReported = (result: TypedResult | null) => {
    if (result !== 'wrong' || step.kind !== 'quiz') return;
    if (step.graded && before?.index === index) {
      onUngrade(step.wordId, before.card, result);
      setResults((r) => r.slice(0, -1));
    } else if (step.practice) {
      setResults((r) => r.slice(0, -1));
    }
    setSteps((s) => s.filter((x, i) => i <= index || x.kind !== 'quiz' || x.graded || x.wordId !== step.wordId));
  };

  return (
    <div className="session">
      <div className="session-top">
        <button className="link-btn" onClick={onExit}>
          ✕ Bitir
        </button>
        <div className="progress-bar" aria-label={`${answered} / ${graded}`}>
          <div style={{ width: `${(index / steps.length) * 100}%` }} />
        </div>
        <span className="muted">
          {index + 1}/{steps.length}
        </span>
      </div>
      {step.kind === 'learn' ? (
        <LearnCard
          key={`${index}-${step.wordId}`}
          word={word}
          autoSpeak={progress.settings.autoSpeak}
          onNext={next}
        />
      ) : (
        <>
          {kind === 'exam' && <div className="badge badge-new">📝 Sınav</div>}
          {!step.graded && !step.practice && <div className="badge badge-retry">Tekrar deneyelim</div>}
          <Quiz
            key={`${index}-${step.wordId}`}
            word={word}
            mode={step.mode}
            note={progress.notes[word.id]}
            autoSpeak={progress.settings.autoSpeak}
            onAnswer={handleAnswer}
            onReported={handleReported}
            onNext={next}
          />
        </>
      )}
    </div>
  );
}

function Summary({ results, exam, onExit }: { results: { wordId: string; result: TypedResult }[]; exam: boolean; onExit: () => void }) {
  const actions = useWordActions();
  const [moved, setMoved] = useState(false);
  const correct = results.filter((r) => r.result !== 'wrong').length;
  const missed = [...new Set(results.filter((r) => r.result === 'wrong').map((r) => r.wordId))];
  // Sınavda bilinemeyen "öğrendim" işaretli kelimeler: tek dokunuşla yeniden öğrenmeye alınabilir.
  const missedKnown = exam && actions ? missed.filter((id) => actions.isKnown(id)) : [];
  const pct = results.length ? Math.round((correct / results.length) * 100) : 0;
  return (
    <div className="card center">
      <EmojiArt emoji={pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '🌱'} className="summary-emoji" />
      <h2>{exam ? 'Sınav tamamlandı!' : 'Oturum tamamlandı!'}</h2>
      {results.length > 0 && (
        <p className="big-stat">
          {correct}/{results.length} doğru <span className="muted">(%{pct})</span>
        </p>
      )}
      {missed.length > 0 && (
        <div className="missed">
          <p className="muted">{exam ? 'Bilemediğin kelimeler:' : 'Bu kelimeler yakında tekrar karşına çıkacak:'}</p>
          <div className="chips">
            {missed.map((id) => (
              <span key={id} className="chip">
                <EmojiArt emoji={wordById(id)!.emoji} className="chip-emoji" /> {wordById(id)!.en} — {wordById(id)!.tr}
              </span>
            ))}
          </div>
        </div>
      )}
      {missedKnown.length > 0 &&
        (moved ? (
          <p className="small notice-ok">Bu kelimeler Öğrendiklerimden çıkarıldı; günlük tekrarlarında yeniden karşına çıkacak.</p>
        ) : (
          <button
            className="btn btn-block"
            onClick={() => {
              actions!.setKnown(missedKnown, false);
              setMoved(true);
            }}
          >
            ↩ Bilemediğin {missedKnown.length} kelimeyi yeniden öğrenmeye al
          </button>
        ))}
      <p className="muted">
        {exam
          ? pct >= 80
            ? 'Harika! Öğrendiklerin yerinde duruyor.'
            : 'Zorlandığın kelimeleri yeniden öğrenmeye alırsan aralıklı tekrar onları kalıcı hâle getirir.'
          : 'Düzenli kısa tekrarlar, tek seferlik uzun çalışmadan çok daha etkilidir. Yarın görüşmek üzere! 👋'}
      </p>
      <button className="btn btn-primary btn-block" onClick={onExit}>
        {exam ? 'Kelimelere dön' : 'Ana sayfaya dön'}
      </button>
    </div>
  );
}
