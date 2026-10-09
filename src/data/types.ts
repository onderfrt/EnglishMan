export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrasal verb' | 'conjunction' | 'preposition';

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type TopicId =
  | 'daily'
  | 'people'
  | 'feelings'
  | 'work'
  | 'travel'
  | 'food'
  | 'nature'
  | 'society'
  | 'ideas'
  | 'verbs'
  | 'adjectives'
  // Akademik Çekirdek konuları
  | 'research'
  | 'change'
  | 'quantity'
  | 'argument'
  | 'science';

/**
 * emoji: Kelimeyi görselleştiren bir ya da birkaç emoji. Soyut kelimelerde birkaç emoji
 * yan yana bir "sahne" anlatır (ör. quit = 👋💼: işe el sallamak).
 */
export type Row = [en: string, tr: string, pos: PartOfSpeech, emoji: string, example: string, exampleTr: string];

export type LevelData = Partial<Record<TopicId, Row[]>>;

/** Akademik kelimeler seviyeleri karışık olduğundan seviye ve eş anlamlılar satırda yer alır. */
export type AcademicRow = [...Row, level: Level, synonyms: string[]];

export type AcademicData = Partial<Record<TopicId, AcademicRow[]>>;
