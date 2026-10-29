import type { ComponentProps } from 'react';
import { customWords } from '../lib/catalog';
import { inOwnList } from '../lib/session';
import type { Progress } from '../lib/storage';
import { CustomWords } from './CustomWords';
import { WordList, type Filter } from './WordList';

export type WordsView = 'builtin' | 'custom' | 'phrasal';

type Props = Omit<ComponentProps<typeof CustomWords>, 'progress' | 'now'> & {
  progress: Progress;
  now: number;
  view: WordsView;
  onViewChange: (v: WordsView) => void;
  /** Hazır kelimelerde ilk durum filtresi (ana sayfadaki sayaçtan "Öğrendiklerim" ile gelinir). */
  initialFilter?: Filter;
};

const TABS: [WordsView, string][] = [
  ['builtin', 'Hazır'],
  ['custom', 'Kelimelerim'],
  ['phrasal', 'Phrasal verb'],
];

/** Kelimeler sekmesi: hazır kelimeler, kullanıcının kendi kelimeleri ve phrasal verb'leri. */
export function WordsTab({ view, onViewChange, progress, now, initialFilter, ...custom }: Props) {
  const count = (v: WordsView) =>
    v === 'builtin' ? null : customWords().filter((w) => inOwnList(w, v === 'phrasal' ? 'phrasal' : 'own')).length;
  return (
    <>
      <div className="segmented words-tabs" role="tablist">
        {TABS.map(([v, label]) => (
          <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => onViewChange(v)}>
            {label}
            {count(v) !== null && <small className="seg-count">{count(v)}</small>}
          </button>
        ))}
      </div>
      {view === 'builtin' ? (
        <WordList progress={progress} now={now} initialFilter={initialFilter} />
      ) : (
        <CustomWords key={view} progress={progress} now={now} {...custom} list={view === 'phrasal' ? 'phrasal' : 'own'} />
      )}
    </>
  );
}
