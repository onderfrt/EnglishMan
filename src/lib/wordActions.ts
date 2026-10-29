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
  /** Kendi kelimeleri "öğrendim" diye işaretler ya da işareti kaldırır. */
  isKnown: (wordId: string) => boolean;
  setKnown: (wordIds: string[], on: boolean) => void;
  /** Verilen kelimelerden (en fazla 20 soruluk) bir sınav başlatır. */
  exam: (words: Word[]) => void;
}

export const WordActionsContext = createContext<WordActions | null>(null);

export const useWordActions = () => useContext(WordActionsContext);
