import type { PartOfSpeech } from '../data/words';

/**
 * İngilizce → Türkçe öneri sözlüğü (KeNet + WordNet'ten otomatik üretilmiş, public/dictionary-en-tr.json).
 * Anlamlar hatalı olabileceği için yalnızca öneri olarak gösterilir; kullanıcı seçer.
 */
export interface DictSense {
  pos: PartOfSpeech;
  meanings: string[];
}

const POS: Record<string, PartOfSpeech> = { n: 'noun', v: 'verb', a: 'adjective', r: 'adverb' };

/** "n:masa;tablo|v:ertelemek" → [{ pos: 'noun', meanings: ['masa', 'tablo'] }, { pos: 'verb', … }] */
export function parseEntry(entry: string): DictSense[] {
  return entry.split('|').map((part) => {
    const [pos, list] = part.split(':');
    return { pos: POS[pos] ?? 'other', meanings: list.split(';') };
  });
}

let dict: Record<string, string> | null = null;
let loading: Promise<Record<string, string>> | null = null;

export function loadDictionary(): Promise<Record<string, string>> {
  if (dict) return Promise.resolve(dict);
  loading ??= fetch(`${import.meta.env.BASE_URL}dictionary-en-tr.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: Record<string, string>) => (dict = d))
    .catch(() => {
      loading = null;
      return {};
    });
  return loading;
}

export function lookup(en: string, d: Record<string, string> | null = dict): DictSense[] {
  const key = en.trim().toLowerCase().replace(/\s+/g, ' ');
  const entry = d?.[key];
  return entry ? parseEntry(entry) : [];
}

/** Toplu eklemede anlamı boş satırlar için: en olası türün ilk iki anlamı. */
export function bestMeaning(senses: DictSense[]): string {
  return senses[0]?.meanings.slice(0, 2).join(', ') ?? '';
}
