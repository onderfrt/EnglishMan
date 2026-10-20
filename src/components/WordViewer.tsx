import { useEffect, useRef, type ReactNode } from 'react';
import type { Word } from '../data/words';
import { useBack } from '../lib/back';
import { speak } from '../lib/speech';
import { formatDue } from '../lib/srs';
import type { Progress } from '../lib/storage';
import { BackBar } from './BackBar';
import { WordDetails } from './WordDetails';

interface Props {
  words: Word[];
  index: number;
  progress: Progress;
  now: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  /** Üst çubukta ek düğme (ör. kendi kelimelerde "Düzenle"). */
  actions?: (word: Word) => ReactNode;
}

/**
 * Kelimeleri tek tek, tam ekran gezme: ‹ › butonları, sağa/sola kaydırma ve klavyede ← → tuşları.
 * Liste arkada açık kalır; kapanınca kaldığın yere dönersin.
 */
export function WordViewer({ words, index, progress, now, onIndexChange, onClose, actions }: Props) {
  const word = words[index];
  const touch = useRef<{ x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const hasPrev = index > 0;
  const hasNext = index < words.length - 1;
  const go = (d: number) => {
    const i = index + d;
    if (i >= 0 && i < words.length) onIndexChange(i);
  };

  useBack(true, onClose);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    if (progress.settings.autoSpeak) speak(word.en);
  }, [word.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const card = progress.cards[word.id];

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
      <BackBar title={`${index + 1} / ${words.length}`}>{actions?.(word)}</BackBar>
      <div className="card" key={word.id}>
        <WordDetails word={word} note={progress.notes[word.id]} editable />
        {card && <p className="muted small center">Sonraki tekrar: {formatDue(card.due, now)}</p>}
      </div>
      <div className="viewer-nav">
        <button className="btn" onClick={() => go(-1)} disabled={!hasPrev} aria-label="Önceki kelime">
          ‹ Önceki
        </button>
        <button className="btn btn-primary" onClick={() => go(1)} disabled={!hasNext} aria-label="Sonraki kelime">
          Sonraki ›
        </button>
      </div>
      <p className="muted small center viewer-hint">İpucu: sağa-sola kaydırarak da geçebilirsin.</p>
    </div>
  );
}
