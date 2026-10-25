import { useEffect } from 'react';
import type { Word } from '../data/words';
import { speak } from '../lib/speech';
import { ReportLink } from './ReportSheet';
import { WordDetails } from './WordDetails';

interface Props {
  word: Word;
  autoSpeak: boolean;
  onNext: () => void;
}

/** Yeni kelimeyle ilk tanışma: görsel + ses + bağlam + kendi çağrışımın. */
export function LearnCard({ word, autoSpeak, onNext }: Props) {
  useEffect(() => {
    if (autoSpeak) speak(word.en);
  }, [word.id]);

  return (
    <div className="card">
      <div className="badge badge-new">Yeni kelime</div>
      <WordDetails word={word} editable />
      <button className="btn btn-primary btn-block sticky-action" onClick={onNext}>
        Anladım, devam →
      </button>
      <ReportLink
        label="⚑ Bu kelimede hata var mı? Bildir"
        getReport={() => ({ wordId: word.id, word: word.en, mode: 'learn', details: { tr: word.tr, example: word.example, exampleTr: word.exampleTr, synonyms: word.synonyms } })}
      />
    </div>
  );
}
