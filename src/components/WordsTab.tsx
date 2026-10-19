import type { ComponentProps } from 'react';
import { customWords } from '../lib/catalog';
import type { Progress } from '../lib/storage';
import { CustomWords } from './CustomWords';
import { WordList } from './WordList';

export type WordsView = 'builtin' | 'custom';

type Props = Omit<ComponentProps<typeof CustomWords>, 'progress' | 'now'> & {
  progress: Progress;
  now: number;
  view: WordsView;
  onViewChange: (v: WordsView) => void;
};

/** Kelimeler sekmesi: hazır kelimeler ve kullanıcının kendi kelimeleri. */
export function WordsTab({ view, onViewChange, progress, now, ...custom }: Props) {
  return (
    <>
      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={view === 'builtin'} className={view === 'builtin' ? 'active' : ''} onClick={() => onViewChange('builtin')}>
          📚 Hazır kelimeler
        </button>
        <button role="tab" aria-selected={view === 'custom'} className={view === 'custom' ? 'active' : ''} onClick={() => onViewChange('custom')}>
          ✍️ Kelimelerim ({customWords().length})
        </button>
      </div>
      {view === 'builtin' ? <WordList progress={progress} now={now} /> : <CustomWords progress={progress} now={now} {...custom} />}
    </>
  );
}
