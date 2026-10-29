import { PHRASAL_VERBS } from '../data/phrasalVerbs';
import type { Word } from '../data/words';
import { allWords } from './catalog';
import type { DictSense } from './dictionary';
import { lookup } from './dictionary';
import type { Suggestion } from './suggest';

/**
 * Phrasal verb'ler: kullanıcının "Phrasal verb'lerim" bölümündeki kelimeler, türü "phrasal verb" olan kendi
 * kelimeleridir. Böylece Kelimelerim'in tüm özellikleri (tekrar, ✓, ♡, sınav, eşitleme) aynen çalışır.
 */
export const isPhrasal = (w: Word): boolean => w.pos === 'phrasal verb';

const PARTICLES = [
  'up', 'down', 'off', 'out', 'in', 'on', 'away', 'back', 'over', 'through', 'into', 'after', 'for', 'with', 'about',
  'around', 'along', 'across', 'apart', 'ahead', 'by', 'forward', 'together', 'aside', 'behind', 'under', 'round',
  'onto', 'upon', 'against', 'at', 'to', 'from', 'of', 'without',
];
/** Bir fiil + bir ya da iki edat/zarf: "give up", "look forward to", "put up with". */
const PATTERN = new RegExp(`^[a-z]+(?: (?:${PARTICLES.join('|')})){1,2}$`);

const normalize = (en: string) => en.trim().toLowerCase().replace(/\s+/g, ' ');

const CURATED = new Map(PHRASAL_VERBS.map(([en, tr]) => [en, tr]));

/** Yazılan ifade bir phrasal verb'e benziyor mu? (Listede olanlar: "get rid of", "take part in" gibi.) */
export function looksPhrasal(en: string): boolean {
  const key = normalize(en);
  return CURATED.has(key) || PATTERN.test(key);
}

/** Hazır listedeki Türkçe anlam (yoksa boş). */
export function curatedMeaning(en: string): string {
  return CURATED.get(normalize(en)) ?? '';
}

/** Hazır listedeki anlamı sözlük önerisi biçiminde verir: "vazgeçmek, bırakmak" → ['vazgeçmek', 'bırakmak']. */
export function curatedSense(en: string): DictSense[] {
  const tr = curatedMeaning(en);
  if (!tr) return [];
  return [{ pos: 'phrasal verb', meanings: tr.split(/[;,]/).map((m) => m.trim()).filter(Boolean) }];
}

/** Toplu eklemede anlamı boş satır için: önce hazır liste, yoksa sözlükteki fiil anlamının ilk ikisi. */
export function phrasalMeaning(en: string, dict: Record<string, string> | null): string {
  const tr = curatedMeaning(en);
  if (tr) return tr.split(';')[0].trim();
  const verb = lookup(en, dict).find((s) => s.pos === 'verb');
  return verb ? verb.meanings.slice(0, 2).join(', ') : '';
}

const dictKeys = new WeakMap<object, string[]>();

/** Sözlükteki phrasal verb'ler (yaklaşık 800). */
function dictionaryPhrasals(dict: Record<string, string>): string[] {
  let keys = dictKeys.get(dict);
  if (!keys) {
    keys = Object.keys(dict).filter((k) => PATTERN.test(k)).sort();
    dictKeys.set(dict, keys);
  }
  return keys;
}

/**
 * Phrasal verb önerileri: uygulamadaki phrasal verb'ler (bilgileriyle), hazır liste (anlamıyla, seçilince anlam
 * dolar), sonra sözlükteki diğerleri (anlam ipucuyla). "give" → give away, give back, give in, give up…
 */
export function suggestPhrasal(prefix: string, dict: Record<string, string> | null, limit = 12): Suggestion[] {
  const p = normalize(prefix);
  if (p.length < 2) return [];
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  const add = (s: Suggestion) => {
    const key = s.en.toLowerCase();
    if (seen.has(key) || out.length >= limit) return;
    seen.add(key);
    out.push(s);
  };
  for (const w of allWords()) if (isPhrasal(w) && w.en.toLowerCase().startsWith(p)) add({ en: w.en, word: w });
  for (const [en, tr] of PHRASAL_VERBS) if (en.startsWith(p)) add({ en, meaning: tr });
  if (dict) {
    for (const en of dictionaryPhrasals(dict)) {
      if (!en.startsWith(p)) continue;
      const verb = lookup(en, dict).find((s) => s.pos === 'verb');
      add({ en, hint: verb?.meanings.slice(0, 2).join(', ') });
    }
  }
  return out.length === 1 && out[0].en.toLowerCase() === p ? [] : out;
}
