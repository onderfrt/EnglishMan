import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Kelime ekleme formundaki öneriler için İngilizce kelime listesi (SCOWL, wordlist-english paketi).
 * En yaygın üç sıklık seviyesi alınır, çekimli biçimler (images, implemented...) ayıklanır ve sık kullanılan
 * kelimeler önce gelecek şekilde public/wordlist.txt olarak yazılır. Uygulama bu dosyayı yalnızca kelime ekleme
 * formu açılınca indirir.
 */
const SOURCE = path.resolve('node_modules/wordlist-english');
const LEVELS = ['10', '20', '35'];

/** "images" → "image", "stopped" → "stop" gibi: kelime, listedeki başka bir kelimenin çekimli biçimi mi? */
function isInflection(w: string, all: Set<string>): boolean {
  const bases: string[] = [];
  if (w.endsWith('s')) bases.push(w.slice(0, -1));
  if (w.endsWith('es')) bases.push(w.slice(0, -2));
  if (w.endsWith('ies')) bases.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ed')) bases.push(w.slice(0, -1), w.slice(0, -2));
  if (w.endsWith('ied')) bases.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ing')) bases.push(w.slice(0, -3), w.slice(0, -3) + 'e');
  // Son ünsüzü ikilenenler: stopped, stopping
  if (/([b-df-hj-np-tv-z])\1(ed|ing)$/.test(w)) bases.push(w.replace(/([b-df-hj-np-tv-z])\1(ed|ing)$/, '$1'));
  return bases.some((b) => b.length > 1 && all.has(b));
}

export function buildWordlist(): string[] {
  const read = (file: string): string[] => JSON.parse(fs.readFileSync(path.join(SOURCE, file), 'utf8'));
  const byLevel = LEVELS.map((l) => [...read(`english-words-${l}.json`), ...read(`british-words-${l}.json`)]);
  const all = new Set(byLevel.flat());
  const out: string[] = [];
  const seen = new Set<string>();
  for (const words of byLevel) {
    for (const w of [...words].sort()) {
      if (seen.has(w) || !/^[a-z]+(-[a-z]+)?$/.test(w) || isInflection(w, all)) continue;
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

export function wordlistAsset(): Plugin {
  return {
    name: 'wordlist-asset',
    configResolved() {
      // SCOWL lisansı, telif notunun listeyle birlikte dağıtılmasını ister.
      const notice = fs
        .readFileSync(path.join(SOURCE, 'Copyright'), 'utf8')
        .split('\n')
        .slice(0, 14)
        .map((l) => `# ${l}`);
      const header = ['# EnglishMan kelime önerileri. Kaynak: SCOWL (http://wordlist.aspell.net/), wordlist-english paketi.', ...notice];
      fs.mkdirSync(path.resolve('public'), { recursive: true });
      fs.writeFileSync(path.resolve('public/wordlist.txt'), [...header, ...buildWordlist()].join('\n'));
    },
  };
}
