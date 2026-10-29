import { useState } from 'react';
import type { Level, Word } from '../data/words';
import { useBack } from '../lib/back';
import { customWords } from '../lib/catalog';
import type { Progress } from '../lib/storage';
import { useWordActions } from '../lib/wordActions';
import { CustomWordForm } from './CustomWordForm';
import { EmojiArt } from './EmojiArt';
import { ImportWords } from './ImportWords';
import { SpeakButton } from './Speak';
import { WordViewer } from './WordViewer';
import { ExamBanner, FilterChips, markMessage, matchesFilter, SelectBar, toggleSelected, WordRowContent, type Filter } from './WordList';

interface Props {
  progress: Progress;
  now: number;
  level: Level;
  onSave: (word: Word) => void;
  onDelete: (ids: string[]) => void;
  onImport: (added: Word[], updated: Word[]) => void;
  /** Verilirse liste yerine bu kelimeyle doldurulmuş ekleme formu açılır. */
  startWith?: string;
}

type Mode = { kind: 'list' } | { kind: 'edit'; word?: Word; en?: string } | { kind: 'import' };

/** Kullanıcının kendi eklediği kelimeler: listele, ekle, düzenle, sil, toplu içe aktar. */
export function CustomWords({ progress, now, level, onSave, onDelete, onImport, startWith }: Props) {
  const [mode, setMode] = useState<Mode>(startWith !== undefined ? { kind: 'edit', en: startWith } : { kind: 'list' });
  const [viewing, setViewing] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [message, setMessage] = useState('');
  // Toplu seçim: null = seçim modu kapalı
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const words = customWords();
  const actions = useWordActions();
  useBack(selected !== null, () => setSelected(null));

  if (mode.kind === 'edit') {
    return (
      <CustomWordForm
        key={mode.word?.id ?? 'new'}
        word={mode.word}
        initialEn={mode.en}
        level={level}
        onSave={(w) => {
          onSave(w);
          setMessage(mode.word ? `✅ “${w.en}” güncellendi.` : `✅ “${w.en}” eklendi. Bir sonraki oturumda karşına çıkacak.`);
          setMode({ kind: 'list' });
        }}
        onDelete={
          mode.word &&
          (() => {
            onDelete([mode.word!.id]);
            setMessage(`🗑️ “${mode.word!.en}” silindi.`);
            setMode({ kind: 'list' });
          })
        }
        onCancel={() => setMode({ kind: 'list' })}
      />
    );
  }

  if (mode.kind === 'import') {
    return (
      <ImportWords
        level={level}
        onImport={(added, updated) => {
          onImport(added, updated);
          setMessage(
            `✅ ${[added.length && `${added.length} kelime eklendi`, updated.length && `${updated.length} kelime güncellendi`]
              .filter(Boolean)
              .join(', ')}.`,
          );
          setMode({ kind: 'list' });
        }}
        onClose={() => setMode({ kind: 'list' })}
      />
    );
  }

  const q = query.trim().toLowerCase();
  const list = words
    .filter((w) => !q || w.en.toLowerCase().includes(q) || w.tr.toLowerCase().includes(q))
    .filter((w) => matchesFilter(w, progress, filter))
    .slice()
    .reverse(); // En son eklenen en üstte

  const selecting = selected !== null;
  const deleteSelected = () => {
    if (!selected?.size) return;
    if (!confirm(`${selected.size} kelime, ilerlemeleri ve fotoğraflarıyla birlikte silinecek. Emin misin?`)) return;
    onDelete([...selected]);
    setMessage(`🗑️ ${selected.size} kelime silindi.`);
    setSelected(null);
  };

  return (
    <div className="word-list custom-words">
      {selecting ? (
        <SelectBar
          list={list}
          selected={selected}
          setSelected={setSelected}
          progress={progress}
          filtered={!!q || filter !== 'all'}
          onMark={(ids, on) => {
            actions?.setKnown(ids, on);
            setMessage(markMessage(ids.length, on));
            setSelected(null);
          }}
        >
          <button className="btn btn-danger" onClick={deleteSelected} disabled={!selected.size}>
            🗑️ Sil ({selected.size})
          </button>
        </SelectBar>
      ) : (
        <div className="row">
          <button className="btn btn-primary" onClick={() => setMode({ kind: 'edit' })}>
            ＋ Kelime ekle
          </button>
          <button className="btn" onClick={() => setMode({ kind: 'import' })}>
            📥 Toplu ekle
          </button>
          {words.length > 0 && (
            <button className="btn" onClick={() => setSelected(new Set())}>
              ☑️ Seç
            </button>
          )}
        </div>
      )}
      {message && !selecting && <p className="small">{message}</p>}

      {words.length === 0 ? (
        <div className="card center">
          <EmojiArt emoji="✍️" className="summary-emoji" />
          <h3>Kendi kelimelerini ekle</h3>
          <p className="muted">
            Kitapta, dizide ya da deneme sınavında karşına çıkan kelimeleri buraya ekle. Anlamını, örnek cümlesini, hatta kendi
            fotoğrafını ekleyebilirsin. Eklediğin kelimeler oturumlarda öncelikli olarak karşına çıkar.
          </p>
        </div>
      ) : (
        <>
          {words.length > 5 && (
            <input
              className="search"
              type="search"
              placeholder="Ara: İngilizce ya da Türkçe"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <FilterChips value={filter} onChange={setFilter} />
          {filter === 'learned' && !selecting && <ExamBanner words={list} />}
          <p className="muted small">
            {selecting ? 'Kelimelere dokunarak seç · ' : ''}
            {q || filter !== 'all' ? `${list.length} / ${words.length}` : words.length} kelime
          </p>
          {list.length === 0 && (
            <p className="card muted center">
              {q
                ? 'Aramana uyan kelime yok.'
                : filter === 'learned'
                  ? 'Henüz Öğrendiklerine eklediğin kelime yok. Kelime kartının sol üstündeki ✓ ile ya da Seç → ✓ Öğrendim ile ekleyebilirsin.'
                  : filter === 'favorites'
                    ? 'Henüz favori kelimen yok. Kelime kartındaki ♡ ile ekleyebilirsin.'
                    : 'Bu filtrede kelime yok.'}
            </p>
          )}
          <ul className="card word-rows">
            {list.map((w, i) => {
              const checked = !!selected?.has(w.id);
              return (
                <li key={w.id} className={`word-row ${checked ? 'row-selected' : ''}`} id={`row-${w.id}`}>
                  <button
                    className="word-row-main"
                    onClick={() => (selecting ? toggleSelected(setSelected, w.id) : setViewing(i))}
                    role={selecting ? 'checkbox' : undefined}
                    aria-checked={selecting ? checked : undefined}
                  >
                    {selecting && <span className={`check ${checked ? 'on' : ''}`}>{checked ? '✓' : ''}</span>}
                    <WordRowContent word={w} progress={progress} />
                  </button>
                  {!selecting && (
                    <>
                      <SpeakButton text={w.en} icon="🔈" />
                      <button className="icon-btn" aria-label={`Düzenle: ${w.en}`} title="Düzenle" onClick={() => setMode({ kind: 'edit', word: w })}>
                        ✏️
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {viewing !== null && list[viewing] && (
        <WordViewer
          words={list}
          index={viewing}
          progress={progress}
          now={now}
          onIndexChange={setViewing}
          onClose={() => setViewing(null)}
          title="Kendi kelimelerim"
          actions={(w) => (
            <button
              className="round-btn"
              aria-label="Düzenle"
              title="Düzenle"
              onClick={() => {
                setViewing(null);
                setMode({ kind: 'edit', word: w });
              }}
            >
              ✏️
            </button>
          )}
        />
      )}
    </div>
  );
}
