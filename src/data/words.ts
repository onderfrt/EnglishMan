import { A1 } from './a1.ts';
import { A2 } from './a2.ts';
import { B1 } from './b1.ts';
import { B2 } from './b2.ts';
import { C1 } from './c1.ts';
import { C2 } from './c2.ts';
import { ACADEMIC, ACADEMIC_EXISTING } from './academic.ts';
import { ACADEMIC_2 } from './academic2.ts';
import type { AcademicRow, Level, LevelData, PartOfSpeech, TopicId } from './types.ts';

export type { Level, PartOfSpeech, TopicId } from './types.ts';

export interface Word {
  id: string;
  en: string;
  tr: string;
  pos: PartOfSpeech;
  /** Kelimeyi görselleştiren emoji (birden fazlaysa bir sahne oluşturur). */
  emoji: string;
  example: string;
  exampleTr: string;
  topic: TopicId;
  level: Level;
  /** Eş anlamlılar (sınavlarda paraphrase bilgisi için önemli). */
  synonyms?: string[];
  /** Kullanıcının kendi eklediği kelime (seviyesi gösterilmez, düzenlenebilir). */
  custom?: boolean;
}

export const LEVELS: Record<Level, { name: string; description: string }> = {
  A1: { name: 'Başlangıç', description: 'Hiç ya da çok az İngilizce biliyorum. Temel günlük kelimeler.' },
  A2: { name: 'Temel', description: 'Basit cümleler kurabiliyorum. Günlük hayat, alışveriş, aile.' },
  B1: { name: 'Orta altı', description: 'Tanıdık konularda konuşabiliyorum. İş, seyahat, duygular.' },
  B2: { name: 'Orta üstü', description: 'Haberleri, dizileri büyük ölçüde anlıyorum. Fikir belirtebiliyorum.' },
  C1: { name: 'İleri', description: 'Akıcıyım; akademik ve iş dünyasının kelimelerini öğrenmek istiyorum.' },
  C2: { name: 'Uzman', description: 'Neredeyse anadil seviyesi. Nadir ve incelikli kelimeler.' },
};

export const LEVEL_ORDER = Object.keys(LEVELS) as Level[];

export const TOPICS: Record<TopicId, { name: string; emoji: string }> = {
  daily: { name: 'Günlük Yaşam', emoji: '🏠' },
  people: { name: 'İnsanlar ve İlişkiler', emoji: '👥' },
  feelings: { name: 'Duygular', emoji: '💗' },
  work: { name: 'İş ve Okul', emoji: '💼' },
  travel: { name: 'Seyahat', emoji: '✈️' },
  food: { name: 'Yemek', emoji: '🍲' },
  nature: { name: 'Doğa ve Hava', emoji: '🌿' },
  society: { name: 'Toplum ve Medya', emoji: '📰' },
  ideas: { name: 'Düşünce ve Kavramlar', emoji: '🧠' },
  verbs: { name: 'Fiiller', emoji: '⚡' },
  adjectives: { name: 'Sıfatlar', emoji: '🎨' },
  research: { name: 'Araştırma ve Analiz', emoji: '🔬' },
  change: { name: 'Değişim, Neden ve Sonuç', emoji: '🔄' },
  quantity: { name: 'Miktar ve Karşılaştırma', emoji: '📊' },
  argument: { name: 'Görüş ve Bağlaçlar', emoji: '💬' },
  science: { name: 'Bilim ve Sağlık', emoji: '🩺' },
  custom: { name: 'Kendi Kelimelerim', emoji: '✍️' },
};

export const POS_TR: Record<PartOfSpeech, string> = {
  noun: 'isim',
  verb: 'fiil',
  adjective: 'sıfat',
  adverb: 'zarf',
  'phrasal verb': 'deyimsel fiil',
  conjunction: 'bağlaç',
  preposition: 'edat',
  other: 'diğer',
};

const DATA: Record<Level, LevelData> = { A1, A2, B1, B2, C1, C2 };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-');

// Kimlik "konu:kelime" biçimindedir ve kayıtlı ilerleme buna bağlıdır; değiştirmeyin.
const GENERAL_WORDS: Word[] = LEVEL_ORDER.flatMap((level) =>
  (Object.entries(DATA[level]) as [TopicId, LevelData[TopicId]][]).flatMap(([topic, rows]) =>
    (rows ?? []).map(([en, tr, pos, emoji, example, exampleTr]) => ({
      id: `${topic}:${slug(en)}`,
      en,
      tr,
      pos,
      emoji,
      example,
      exampleTr,
      topic,
      level,
      ...(ACADEMIC_EXISTING[en] && { synonyms: ACADEMIC_EXISTING[en] }),
    })),
  ),
);

const ACADEMIC_WORDS: Word[] = [ACADEMIC, ACADEMIC_2].flatMap((data) =>
  (Object.entries(data) as [TopicId, AcademicRow[]][]).flatMap(([topic, rows]) =>
    rows.map(([en, tr, pos, emoji, example, exampleTr, level, synonyms]) => ({
      id: `${topic}:${slug(en)}`,
      en,
      tr,
      pos,
      emoji,
      example,
      exampleTr,
      topic,
      level,
      synonyms,
    })),
  ),
);

export const WORDS: Word[] = [...GENERAL_WORDS, ...ACADEMIC_WORDS];

const byLevel = (a: Word, b: Word) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level);

/** Kelime paketleri: belirli bir hedef için seçilmiş kelimeler. */
export const PACKS = {
  academic: {
    name: 'Akademik Çekirdek',
    description: 'YDS, YÖKDİL ve IELTS’te sık geçen akademik kelimeler ve bağlaçlar.',
    // Kolaydan zora: önce B1, sonra B2, C1...
    words: [...ACADEMIC_WORDS, ...GENERAL_WORDS.filter((w) => ACADEMIC_EXISTING[w.en])].sort(byLevel),
  },
};

export type PackId = keyof typeof PACKS;

export type Goal = 'general' | 'yds' | 'yokdil' | 'ielts';

export const GOALS: Record<Goal, { name: string; emoji: string; description: string; pack: PackId | null }> = {
  yds: { name: 'YDS', emoji: '🎓', description: 'Akademik kelimeler, eş anlamlılar ve bağlaçlar.', pack: 'academic' },
  yokdil: { name: 'YÖKDİL', emoji: '🏛️', description: 'Akademik kelimeler, eş anlamlılar ve bağlaçlar.', pack: 'academic' },
  ielts: { name: 'IELTS', emoji: '🌍', description: 'Akademik kelimeler ve eş anlamlılar. IELTS konu paketleri yakında.', pack: 'academic' },
  general: { name: 'Genel İngilizce', emoji: '💬', description: 'Seviyene göre günlük hayatın kelimeleri (A1–C2).', pack: null },
};

export const WORDS_BY_ID: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.id, w]));
