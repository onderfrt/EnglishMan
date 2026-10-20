import type { Word } from '../data/words';
import { allWords } from './catalog';

/** Öneri: uygulamada olan bir kelime (anlamıyla) ya da yalnızca İngilizce kelime listesinden gelen bir kelime. */
export interface Suggestion {
  en: string;
  word?: Word;
}

let wordlist: string[] | null = null;
let loading: Promise<string[]> | null = null;

/** Kelime listesini (public/wordlist.txt) ilk ihtiyaçta bir kez indirir. İnternet yoksa yalnızca uygulamadaki kelimeler önerilir. */
export function loadWordlist(): Promise<string[]> {
  if (wordlist) return Promise.resolve(wordlist);
  loading ??= fetch(`${import.meta.env.BASE_URL}wordlist.txt`)
    .then((r) => (r.ok ? r.text() : ''))
    .then((text) => (wordlist = text.split('\n').filter((l) => l && !l.startsWith('#'))))
    .catch(() => {
      loading = null;
      return [];
    });
  return loading;
}

/**
 * Bu harflerle başlayan kelimeler. Uygulamadaki kelimeler (anlamıyla) en fazla üçte birini kaplar; kalan yerler
 * sık kullanılan İngilizce kelimelerle dolar, ör. "im" → impact, improve… ve image, important…
 */
export function suggest(prefix: string, list: string[] = wordlist ?? [], limit = 12): Suggestion[] {
  const p = prefix.trim().toLowerCase();
  if (p.length < 2) return [];
  const rank = new Map<string, number>();
  const fromList: string[] = [];
  list.forEach((en, i) => {
    if (en.startsWith(p)) {
      rank.set(en, i);
      fromList.push(en);
    }
  });
  // Uygulamadaki kelimeler de sık kullanılandan seyreğe sıralanır.
  const own = allWords()
    .filter((w) => w.en.toLowerCase().startsWith(p))
    .sort((a, b) => (rank.get(a.en) ?? Infinity) - (rank.get(b.en) ?? Infinity) || a.en.length - b.en.length);
  const ownKeys = new Set(own.map((w) => w.en.toLowerCase()));
  const others = fromList.filter((en) => !ownKeys.has(en));
  const ownCount = Math.min(own.length, Math.max(Math.ceil(limit / 3), limit - others.length));
  const out: Suggestion[] = [
    ...own.slice(0, ownCount).map((w) => ({ en: w.en, word: w })),
    ...others.slice(0, limit - ownCount).map((en) => ({ en })),
  ];
  // Yazılanın tamamı zaten tek öneriyse listeyi gösterme.
  return out.length === 1 && out[0].en.toLowerCase() === p ? [] : out;
}
