import { PACKS, WORDS, type Word } from '../data/words';
import { shuffle, type Rng } from './random';

/**
 * YDS / YÖKDİL tarzı sorular:
 * - Boşluk doldurma: örnek cümlede kelime boşluğa dönüşür, A–E şıkları aynı dilbilgisi biçimindedir.
 * - Eş anlamlı: kelimeye anlamca en yakın seçenek bulunur.
 */

export type Inflection = 'base' | 's' | 'ed' | 'ing';

/** Düzensiz fiiller -ed ile çekimlenemez; boşluk doldurmada geçmiş zaman şıkkı olarak kullanılmaz. */
const IRREGULAR_VERBS = new Set([
  'lend', 'get dressed', 'wake up', 'buy', 'sleep', 'write', 'read', 'go', 'come', 'eat', 'drink', 'see',
  'find out', 'give up', 'forget', 'quit', 'get over', 'get on with', 'lead to', 'seek', 'overcome', 'undergo',
  'withdraw', 'arise', 'mean', 'pay', 'make', 'take', 'think', 'bring', 'teach', 'feel', 'leave', 'keep',
]);

/** Son ünsüzü ikilenen fiiller (occur → occurred, occurring). */
const DOUBLE_FINAL = new Set(['occur', 'refer', 'prefer', 'permit', 'commit', 'admit', 'control', 'regret', 'transfer', 'compel', 'plan', 'stop']);

/** -s ile çoğul yapılamayan isimler. */
const IRREGULAR_PLURALS = new Set(['data', 'criteria', 'phenomenon', 'species', 'hypothesis', 'leftovers', 'evidence', 'research']);

function inflectOne(w: string, type: Inflection): string {
  if (type === 'base') return w;
  if (type === 's') {
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
    if (/(s|sh|ch|x|z)$/.test(w)) return w + 'es';
    return w + 's';
  }
  if ((type === 'ed' || type === 'ing') && DOUBLE_FINAL.has(w)) return w + w.at(-1) + type;
  if (type === 'ed') {
    if (w.endsWith('e')) return w + 'd';
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ied';
    return w + 'ed';
  }
  if (w.endsWith('ie')) return w.slice(0, -2) + 'ying';
  if (/[^aeiou]e$/.test(w) && w !== 'be') return w.slice(0, -1) + 'ing';
  return w + 'ing';
}

/** Kelimeyi çekimler; deyimsel fiillerde yalnızca ilk kelime çekimlenir (result in → resulted in). */
export function inflect(en: string, type: Inflection): string {
  const [head, ...rest] = en.split(' ');
  return [inflectOne(head, type), ...rest].join(' ');
}

function canInflect(w: Word, type: Inflection): boolean {
  if (type === 'base') return true;
  if (type === 'ed' || type === 'ing') return ['verb', 'phrasal verb'].includes(w.pos) && !IRREGULAR_VERBS.has(w.en);
  return (w.pos === 'noun' && !IRREGULAR_PLURALS.has(w.en)) || (['verb', 'phrasal verb'].includes(w.pos) && !IRREGULAR_VERBS.has(w.en));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Kelimenin örnek cümledeki yerini ve biçimini bulur. Düzensiz biçimler (ör. lent) bulunamaz → null. */
export function findInSentence(word: Word, sentence: string): { index: number; form: string; type: Inflection } | null {
  const types: Inflection[] = ['base', 's', 'ed', 'ing'];
  for (const type of types) {
    if (type !== 'base' && !canInflect(word, type)) continue;
    const form = inflect(word.en, type);
    const m = new RegExp(`\\b${escape(form)}\\b`, 'i').exec(sentence);
    if (m) return { index: m.index, form: m[0], type };
  }
  return null;
}

export interface ClozeQuestion {
  before: string;
  after: string;
  /** Cümlenin Türkçesi: kısa cümlelerde birden fazla şıkkın uymasını önler. */
  translation: string;
  answer: string;
  options: string[];
}

/** İki kelime birbirinin eş anlamlısıysa ikisi de boşluğa uyabilir; böyle çeldiriciler kullanılmaz. */
function related(a: Word, b: Word): boolean {
  return !!(a.synonyms?.includes(b.en) || b.synonyms?.includes(a.en) || a.synonyms?.some((x) => b.synonyms?.includes(x)));
}

/** Az kelimeli türlerde çeldirici yetmezse benzer görevdeki türlerden de alınır. */
const POS_GROUP: Partial<Record<Word['pos'], Word['pos'][]>> = {
  conjunction: ['conjunction', 'preposition', 'adverb'],
  preposition: ['preposition', 'conjunction', 'adverb'],
  'phrasal verb': ['phrasal verb', 'verb'],
};

/**
 * Çeldirici havuzu: aynı türden, hedef kelimeyle ilişkisiz kelimeler. Önce Akademik Çekirdek,
 * yetmezse tüm kelimeler, o da yetmezse benzer türler denenir.
 */
function distractorPool(word: Word, ok: (w: Word) => boolean, sameFormOnly = false): Word[] {
  const base = (w: Word) => w.id !== word.id && !related(word, w) && ok(w);
  const tries = [
    PACKS.academic.words.filter((w) => base(w) && w.pos === word.pos),
    WORDS.filter((w) => base(w) && w.pos === word.pos),
  ];
  if (!sameFormOnly) {
    const group = POS_GROUP[word.pos] ?? [word.pos];
    // Bağlaç/edat sorularında zarflardan yalnızca bağlaç görevi görenler (moreover, however...) şık olur.
    const linkerOnly = word.pos === 'conjunction' || word.pos === 'preposition';
    tries.push(WORDS.filter((w) => base(w) && group.includes(w.pos) && (!linkerOnly || w.topic === 'argument')));
  }
  return tries.find((t) => t.length >= 4) ?? [];
}

export function clozeQuestion(word: Word, rng: Rng = Math.random): ClozeQuestion | null {
  const found = findInSentence(word, word.example);
  if (!found) return null;
  // Çekimli biçimlerde şıklar aynı türden ve aynı çekimde olmalı (biçim ipucu vermesin).
  // Çekimsiz bağlaç/edatlarda ise diğer bağlaç ve edatlar çeldirici olur: although ↔ despite ayrımı
  // YDS'nin tam da ölçtüğü şeydir.
  const pool = distractorPool(word, (w) => canInflect(w, found.type), found.type !== 'base');
  if (pool.length < 4) return null;
  const distractors = shuffle(pool, rng)
    .slice(0, 4)
    .map((w) => inflect(w.en, found.type));
  const answer = found.form.toLowerCase();
  return {
    before: word.example.slice(0, found.index),
    after: word.example.slice(found.index + found.form.length),
    translation: word.exampleTr,
    answer,
    options: shuffle([answer, ...distractors], rng),
  };
}

export interface SynonymQuestion {
  answer: string;
  options: string[];
}

export function synonymQuestion(word: Word, rng: Rng = Math.random): SynonymQuestion | null {
  if (!word.synonyms?.length) return null;
  // Tek kelimelik eş anlamlılar tercih edilir (şıklar daha dengeli görünür).
  const single = word.synonyms.filter((x) => !x.includes(' '));
  const answer = shuffle(single.length ? single : word.synonyms, rng)[0];
  const multiword = word.en.includes(' ');
  const pool = distractorPool(
    word,
    (w) => (multiword || !w.en.includes(' ')) && w.en !== answer && !w.synonyms?.includes(answer),
  );
  if (pool.length < 4) return null;
  return { answer, options: shuffle([answer, ...shuffle(pool, rng).slice(0, 4).map((w) => w.en)], rng) };
}
