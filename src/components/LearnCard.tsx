import { useEffect, useState } from 'react';
import type { Word } from '../data/words';
import { speak } from '../lib/speech';
import { WordDetails } from './WordDetails';

interface Props {
  word: Word;
  note: string;
  autoSpeak: boolean;
  onNote: (note: string) => void;
  onNext: () => void;
}

/** Yeni kelimeyle ilk tanışma: görsel + ses + bağlam + kendi çağrışımın. */
export function LearnCard({ word, note, autoSpeak, onNote, onNext }: Props) {
  const [draft, setDraft] = useState(note);

  useEffect(() => {
    setDraft(note);
    if (autoSpeak) speak(word.en);
  }, [word.id]);

  const next = () => {
    if (draft.trim() !== note) onNote(draft.trim());
    onNext();
  };

  return (
    <div className="card">
      <div className="badge badge-new">Yeni kelime</div>
      <WordDetails word={word} />
      <label className="note-input">
        <span>💭 Kendi çağrışımın (isteğe bağlı)</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && next()}
          placeholder={`ör. "${word.en}" sana neyi hatırlatıyor?`}
        />
        <small>Kelimeyi bildiğin bir şeye bağlamak (ses benzerliği, bir anı, komik bir sahne) akılda kalmasını çok kolaylaştırır.</small>
      </label>
      <button className="btn btn-primary btn-block" onClick={next}>
        Anladım, devam →
      </button>
    </div>
  );
}
