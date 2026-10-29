import { useEffect, useRef, useState, type ReactNode } from 'react';
import { POS_TR, type Word } from '../data/words';
import { goBack, useBack } from '../lib/back';
import { PRACTICE_MAX } from '../lib/session';
import { SLOW_RATE, speak } from '../lib/speech';
import { formatDue } from '../lib/srs';
import type { Progress } from '../lib/storage';
import { useWordActions } from '../lib/wordActions';
import { WordDetails } from './WordDetails';
import { WordVisual } from './WordVisual';

interface Props {
  words: Word[];
  index: number;
  progress: Progress;
  now: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  /** Üstte gösterilen liste adı (ör. "Kendi kelimelerim"). */
  title?: string;
  /** Üst çubukta ek düğme (ör. kendi kelimelerde "Düzenle"). */
  actions?: (word: Word) => ReactNode;
}

const RECALL_KEY = 'englishman:viewer-recall';

function readRecall(): boolean {
  try {
    return localStorage.getItem(RECALL_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Kelimeleri deste gibi tek tek gezme: ‹ › butonları, sağa/sola kaydırma ve klavyede ← → tuşları.
 * "Önce hatırla" açıkken kart kapalı gelir: önce anlamı hatırlamaya çalışırsın, sonra karta dokunup çevirirsin.
 * Liste arkada açık kalır; kapanınca kaldığın yere dönersin.
 */
export function WordViewer({ words, index, progress, now, onIndexChange, onClose, title, actions }: Props) {
  const word = words[index];
  const wordActions = useWordActions();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [recall, setRecall] = useState(readRecall);
  const [revealed, setRevealed] = useState(false);
  const hasPrev = index > 0;
  const hasNext = index < words.length - 1;
  const hidden = recall && !revealed;
  const go = (d: number) => {
    const i = index + d;
    if (i >= 0 && i < words.length) onIndexChange(i);
  };

  useBack(true, onClose);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setRevealed(false);
    if (progress.settings.autoSpeak) speak(word.en);
  }, [word.id]);

  const toggleRecall = () => {
    const next = !recall;
    setRecall(next);
    setRevealed(false);
    try {
      localStorage.setItem(RECALL_KEY, next ? '1' : '0');
    } catch {
      // Tercih yalnızca bu oturumda kalır.
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (hidden && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const card = progress.cards[word.id];
  // Quiz: bu kelimeden başlayarak en fazla 10 kelime.
  const quizWords = [...words.slice(index), ...words.slice(0, index)].slice(0, PRACTICE_MAX);

  return (
    <div
      className="viewer"
      ref={scroller}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        touch.current = null;
        // Yatay ve yeterince uzun kaydırma: sola → sonraki, sağa → önceki.
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
      }}
    >
      <header className="viewer-top">
        <button type="button" className="round-btn" onClick={goBack} aria-label="Kapat">
          ✕
        </button>
        <div className="viewer-progress">
          <span className="muted small viewer-count">
            {title && <span className="ellipsis">{title}</span>}
            <span>
              {title ? '· ' : ''}
              {index + 1} / {words.length}
            </span>
          </span>
          <div className="meter thin">
            <span style={{ width: `${((index + 1) / words.length) * 100}%` }} />
          </div>
        </div>
        <button
          type="button"
          className={`round-btn ${recall ? 'on' : ''}`}
          onClick={toggleRecall}
          aria-pressed={recall}
          title={recall ? 'Önce hatırla: açık' : 'Önce hatırla: kapalı'}
          aria-label="Önce hatırla modu"
        >
          🙈
        </button>
        {actions?.(word)}
        {wordActions && (
          <button type="button" className="quiz-pill" onClick={() => wordActions.practice(quizWords)} title={`${quizWords.length} kelimeyle quiz`}>
            Quiz ›
          </button>
        )}
      </header>

      {hidden ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Kartı çevir, anlamını göster"
          className="card viewer-card flip-front"
          key={`front-${word.id}`}
          onClick={() => setRevealed(true)}
        >
          <WordVisual word={word} />
          <span className="word-en">{word.en}</span>
          <span className="muted small">{POS_TR[word.pos]}</span>
          <span className="flip-listen" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="chip-btn" onClick={() => speak(word.en)}>
              ▶ Dinle
            </button>
            <button type="button" className="chip-btn" onClick={() => speak(word.en, SLOW_RATE)}>
              🐢 Yavaş
            </button>
          </span>
          <span className="muted small flip-hint">Anlamını hatırlamaya çalış, sonra karta dokun</span>
        </div>
      ) : (
        <div className="card viewer-card" key={word.id}>
          <WordDetails
            word={word}
            editable
            footer={
              wordActions?.isKnown(word.id)
                ? 'Öğrendiklerimde · günlük tekrarlarda çıkmaz'
                : card
                  ? `Tekrar: ${formatDue(card.due, now)}`
                  : undefined
            }
          />
        </div>
      )}

      <div className="viewer-nav">
        <button className="btn prev-btn" onClick={() => go(-1)} disabled={!hasPrev} aria-label="Önceki kelime">
          ‹ Önceki
        </button>
        {hidden ? (
          <button className="btn btn-primary" onClick={() => setRevealed(true)}>
            Anlamını göster
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => go(1)} disabled={!hasNext} aria-label="Sonraki kelime">
            Sonraki ›
          </button>
        )}
      </div>
    </div>
  );
}
