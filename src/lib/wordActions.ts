import { createContext, useContext } from 'react';
import type { Word } from '../data/words';

/** Kelime kartındaki eylemler (hafıza ipucu, favori, quiz); App sağlar, kartlar derinden kullanır. */
export interface WordActions {
  notes: Record<string, string>;
  setNote: (wordId: string, note: string) => void;
  isFavorite: (wordId: string) => boolean;
  toggleFavorite: (wordId: string) => void;
  /** Verilen kelimelerle hemen bir quiz başlatır. */
  practice: (words: Word[]) => void;
}

export const WordActionsContext = createContext<WordActions | null>(null);

export const useWordActions = () => useContext(WordActionsContext);
