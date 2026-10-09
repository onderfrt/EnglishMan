export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrasal verb';

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
  | 'adjectives';

/**
 * emoji: Kelimeyi görselleştiren bir ya da birkaç emoji. Soyut kelimelerde birkaç emoji
 * yan yana bir "sahne" anlatır (ör. quit = 👋💼: işe el sallamak).
 */
export type Row = [en: string, tr: string, pos: PartOfSpeech, emoji: string, example: string, exampleTr: string];

export type LevelData = Partial<Record<TopicId, Row[]>>;
