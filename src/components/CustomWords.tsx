import { useState } from 'react';
import type { Level, Word } from '../data/words';
import { customWords } from '../lib/catalog';
import { formatDue } from '../lib/srs';
import type { Progress } from '../lib/storage';
import { CustomWordForm } from './CustomWordForm';
import { EmojiArt } from './EmojiArt';
import { ImportWords } from './ImportWords';
import { SpeakButton } from './Speak';
import { WordDetails } from './WordDetails';
import { STATUS_LABEL, status } from './WordList';

interface Props {
  progress: Progress;
  now: number;
  level: Level;
  onSave: (word: Word) => void;
  onDelete: (id: string) => void;
  onImport: (words: Word[]) => void;
}

type Mode = { kind: 'list' } | { kind: 'edit'; word?: Word } | { kind: 'import' };

/** Kullanıcının kendi eklediği kelimeler: listele, ekle, düzenle, sil, toplu içe aktar. */
export function CustomWords({ progress, now, level, onSave, onDelete, onImport }: Props) {
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const words = customWords();

  if (mode.kind === 'edit') {
    return (
      <CustomWordForm
        key={mode.word?.id ?? 'new'}
        word={mode.word}
        level={level}
        onSave={(w) => {
          onSave(w);
          setMessage(mode.word ? `✅ “${w.en}” güncellendi.` : `✅ “${w.en}” eklendi. Bir sonraki oturumda karşına çıkacak.`);
          setOpen(w.id);
          setMode({ kind: 'list' });
        }}
        onDelete={
          mode.word &&
          (() => {
            onDelete(mode.word!.id);
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
        onImport={(ws) => {
          onImport(ws);
          setMessage(`✅ ${ws.length} kelime eklendi.`);
          setMode({ kind: 'list' });
        }}
        onClose={() => setMode({ kind: 'list' })}
      />
    );
  }

  const q = query.trim().toLowerCase();
  const list = words
    .filter((w) => !q || w.en.toLowerCase().includes(q) || w.tr.toLowerCase().includes(q))
    .slice()
    .reverse(); // En son eklenen en üstte

  return (
    <div className="word-list custom-words">
      <div className="row">
        <button className="btn btn-primary" onClick={() => setMode({ kind: 'edit' })}>
          ＋ Kelime ekle
        </button>
        <button className="btn" onClick={() => setMode({ kind: 'import' })}>
          📥 Toplu ekle
        </button>
      </div>
      {message && <p className="small">{message}</p>}

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
              placeholder="🔎 Kendi kelimelerinde ara"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <p className="muted small">{words.length} kelime</p>
          <ul>
            {list.map((w) => {
              const card = progress.cards[w.id];
              const st = status(card);
              return (
                <li key={w.id} className="word-row">
                  <button className="word-row-main" onClick={() => setOpen(open === w.id ? null : w.id)}>
                    <EmojiArt emoji={w.emoji} className="row-emoji" />
                    <span className="row-text">
                      <b>{w.en}</b>
                      <span className="muted">{w.tr}</span>
                    </span>
                    <span className={`status status-${st}`}>{STATUS_LABEL[st]}</span>
                  </button>
                  <SpeakButton text={w.en} />
                  <button className="icon-btn" aria-label={`Düzenle: ${w.en}`} title="Düzenle" onClick={() => setMode({ kind: 'edit', word: w })}>
                    ✏️
                  </button>
                  {open === w.id && (
                    <div className="row-details">
                      <WordDetails word={w} note={progress.notes[w.id]} editable />
                      {card && <p className="muted small center">Sonraki tekrar: {formatDue(card.due, now)}</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
