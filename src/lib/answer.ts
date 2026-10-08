/** Yazılan cevabı karşılaştırmak için sadeleştirir: büyük/küçük harf, boşluk ve noktalama farkını yok sayar. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

export type TypedResult = 'correct' | 'typo' | 'wrong';

/** İngiliz/Amerikan yazım farkları (realise/realize, neighbour/neighbor) da doğru kabul edilir. */
const VARIANTS: [RegExp, string][] = [
  [/ise\b/g, 'ize'],
  [/our\b/g, 'or'],
];

function variants(s: string): string[] {
  const out = new Set([s]);
  for (const [re, rep] of VARIANTS) out.add(s.replace(re, rep));
  return [...out];
}

export function checkTyped(input: string, expected: string): TypedResult {
  const given = normalize(input);
  if (!given) return 'wrong';
  const targets = variants(normalize(expected));
  if (targets.some((t) => variants(given).includes(t))) return 'correct';
  // Uzun kelimelerde tek harflik hata "küçük yazım hatası" sayılır.
  const tolerance = targets[0].length >= 5 ? 1 : 0;
  if (targets.some((t) => levenshtein(given, t) <= tolerance)) return 'typo';
  return 'wrong';
}
