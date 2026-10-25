import { POS_TR, type Word } from '../data/words';
import { SLOW_RATE, speak } from '../lib/speech';
import { useState } from 'react';
import { useWordActions } from '../lib/wordActions';
import { SpeakButton } from './Speak';
import { WordVisual } from './WordVisual';

interface Props {
  word: Word;
  /** Hafıza ipucu (kullanıcının notu). Verilmezse ve kart düzenlenebilirse ortak durumdan okunur. */
  note?: string;
  /** Görsel eklenebilir, hafıza ipucu yazılabilir, favoriye eklenebilir. */
  editable?: boolean;
  /** Alt satırda gösterilir (ör. "Tekrar: 23 saat sonra"). */
  footer?: string;
  /** false: favori ve hafıza ipucu gösterilmez (ör. henüz kaydedilmemiş kelimenin önizlemesi). */
  extras?: boolean;
}

/** Kelime kartı: kelime ve anlamı en üstte, görsel kartın ana parçası, hafıza ipucu, örnek cümle, eş anlamlılar. */
export function WordDetails({ word, note, editable, footer, extras = true }: Props) {
  const actions = useWordActions();
  const hint = note ?? (editable ? actions?.notes[word.id] : undefined);
  const canEdit = editable && extras && !!actions;
  const favorite = canEdit && actions.isFavorite(word.id);

  return (
    <div className="word-details">
      <div className="wd-head">
        <div className="wd-title">
          <span className="word-en">{word.en}</span>
          <span className="word-tr">{word.tr}</span>
        </div>
        <div className="wd-side">
          <span className="wd-pos">
            <span className={`pos-dot pos-${word.pos.replace(' ', '-')}`} />
            {POS_TR[word.pos]}
            {word.custom ? '' : ` · ${word.level}`}
          </span>
          <span className="wd-play">
            <SpeakButton text={word.en} rate={SLOW_RATE} label="Yavaş dinle" icon="🐢" />
            <SpeakButton text={word.en} icon="▶" className="play-btn" />
          </span>
        </div>
      </div>

      <div className="wd-visual">
        <WordVisual word={word} editable={editable} />
        {canEdit && (
          <button
            type="button"
            className={`fav-btn ${favorite ? 'on' : ''}`}
            onClick={() => actions.toggleFavorite(word.id)}
            aria-pressed={favorite}
            aria-label={favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            title={favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            {favorite ? '♥' : '♡'}
          </button>
        )}
      </div>

      {canEdit ? <HintEditor wordId={word.id} note={hint ?? ''} onSave={actions.setNote} /> : extras && hint && <HintBox note={hint} />}

      {(word.example || word.exampleTr) && (
        <div className="example">
          {word.example && (
            <div className="example-en">
              <Highlighted sentence={word.example} word={word.en} />
              <SpeakButton text={word.example} label="Cümleyi dinle" icon="▶" />
            </div>
          )}
          {word.exampleTr && <div className="example-tr">{word.exampleTr}</div>}
        </div>
      )}

      {(word.synonyms?.length || footer) && (
        <div className="wd-foot">
          {word.synonyms && word.synonyms.length > 0 && (
            <span className="synonyms">
              <span className="muted">≈</span>
              {word.synonyms.map((x) => (
                <button key={x} type="button" className="chip" onClick={() => speak(x)} title="Dinle">
                  {x}
                </button>
              ))}
            </span>
          )}
          {footer && <span className="muted small">{footer}</span>}
        </div>
      )}
    </div>
  );
}

function HintBox({ note, onEdit }: { note: string; onEdit?: () => void }) {
  return (
    <div className="hint-box">
      <span className="hint-label">
        💡 Hafıza ipucu
        {onEdit && (
          <button type="button" className="link-btn" onClick={onEdit}>
            Düzenle
          </button>
        )}
      </span>
      <p>{note}</p>
    </div>
  );
}

/** Kullanıcının kendi hafıza ipucu: benzer ses, kısa bir hikâye ya da bir anı. */
function HintEditor({ wordId, note, onSave }: { wordId: string; note: string; onSave: (id: string, note: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  if (!editing) {
    return note ? (
      <HintBox note={note} onEdit={() => (setDraft(note), setEditing(true))} />
    ) : (
      <button type="button" className="hint-add" onClick={() => (setDraft(''), setEditing(true))}>
        💡 Hafıza ipucu ekle
        <span className="small muted">Benzer ses, kısa bir hikâye ya da bir anı</span>
      </button>
    );
  }
  const save = () => {
    if (draft.trim() !== note) onSave(wordId, draft.trim());
    setEditing(false);
  };
  return (
    <div className="hint-box editing">
      <span className="hint-label">💡 Hafıza ipucu</span>
      <textarea
        autoFocus
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="ör. Benzer ses: abla iş. Ablamın işini tamamen kaldırdılar."
      />
      <div className="row">
        {note && (
          <button type="button" className="btn btn-sm" onClick={() => (onSave(wordId, ''), setEditing(false))}>
            Sil
          </button>
        )}
        <button type="button" className="btn btn-sm" onClick={() => setEditing(false)}>
          Vazgeç
        </button>
        <button type="button" className="btn btn-sm btn-primary" onClick={save}>
          Kaydet
        </button>
      </div>
    </div>
  );
}

/** Örnek cümlede kelimenin geçtiği yeri (çekimli hâlleri dahil, ör. lent/booked) vurgular. */
function Highlighted({ sentence, word }: { sentence: string; word: string }) {
  const stem = word.split(' ')[0].replace(/e$/, '').slice(0, Math.max(3, word.length - 2));
  const re = new RegExp(`\\b(${escape(stem)}\\w*)`, 'i');
  const m = sentence.match(re);
  if (!m || m.index === undefined) return <span>{sentence}</span>;
  return (
    <span>
      {sentence.slice(0, m.index)}
      <mark>{m[0]}</mark>
      {sentence.slice(m.index + m[0].length)}
    </span>
  );
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
