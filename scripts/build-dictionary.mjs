// İngilizce → Türkçe öneri sözlüğü üretir: public/dictionary-en-tr.json
//
// Kaynak: KeNet (Türkçe WordNet, StarLang Yazılım / İTÜ, ISC lisansı) ve Princeton WordNet 3.1.
// Karşılıkları sıralamak için Türkçe kelime sıklığı: OpenSubtitles 2024 (OPUS), @zxcvbn-ts/language-tr paketi (MIT).
// Sıklık listesi yalnızca sıralamada kullanılır, çıktıya girmez.
// KeNet'teki her Türkçe eş anlamlı kümesi <ILR> ile İngilizce WordNet kümelerine bağlıdır; bu bağlantılardan
// her İngilizce kelime için en çok geçen Türkçe karşılıklar çıkarılır.
//
// Kaynak paket çok büyük (~200 MB) olduğundan projeye bağımlılık olarak eklenmez. Sözlüğü yenilemek için:
//   npm install --no-save nlptoolkit-wordnet@1.0.7 @zxcvbn-ts/language-tr@4.1.1 && node scripts/build-dictionary.mjs
// (wordlist-english paketi zaten geliştirme bağımlılığıdır.)
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('node_modules/nlptoolkit-wordnet');
const OUT = path.resolve('public/dictionary-en-tr.json');

const synsets = (xml) => xml.split('<SYNSET>').slice(1);
const literals = (s) => [...s.matchAll(/<LITERAL>([^<]+)<SENSE>/g)].map((m) => m[1].trim());
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"');

// 1) İngilizce WordNet: kelime → [küme kimliği, tür]
const enWords = new Map();
for (const s of synsets(fs.readFileSync(path.join(SRC, 'english_wordnet_version_31.xml'), 'utf8'))) {
  const id = s.match(/<ID>([^<]+)<\/ID>/)?.[1];
  if (!id) continue;
  const pos = id.at(-1); // n, v, a, s, r
  for (const lit of literals(s)) {
    const w = decode(lit).toLowerCase().replace(/_/g, ' ');
    if (!/^[a-z]+([ -][a-z]+){0,2}$/.test(w)) continue;
    if (!enWords.has(w)) enWords.set(w, []);
    enWords.get(w).push({ id, pos: pos === 's' ? 'a' : pos });
  }
}

// 2) KeNet: İngilizce küme → Türkçe karşılıklar
const toTr = new Map();
for (const s of synsets(fs.readFileSync(path.join(SRC, 'turkish_wordnet.xml'), 'utf8'))) {
  const tr = literals(s)
    .map(decode)
    .filter((l) => !l.startsWith('(') && l.length < 40);
  const links = [...s.matchAll(/<ILR>(ENG31-[^<]+)<TYPE>SYNONYM<\/TYPE><\/ILR>/g)].map((m) => m[1]);
  for (const id of links) {
    if (!toTr.has(id)) toTr.set(id, []);
    toTr.get(id).push(...tr);
  }
}

// 3) Hangi İngilizce kelimeler? SCOWL'un en yaygın üç seviyesindeki kelimeler (çekimli biçimler dahil, ör. tired,
//    quickly) ve bunlardan oluşan ifadeler (give up, look after...).
const scowl = new Set(
  ['10', '20', '35'].flatMap((l) =>
    ['english', 'british'].flatMap((d) =>
      JSON.parse(fs.readFileSync(path.resolve(`node_modules/wordlist-english/${d}-words-${l}.json`), 'utf8')),
    ),
  ),
);
const wanted = (w) => w.split(/[ -]/).every((part) => scowl.has(part));

// 4) Kelime başına, türlere göre karşılıklar. WordNet'te anlam sıklığı olmadığından sıralama sezgiseldir:
//    - türler, kelimenin o türde kaç anlamı olduğuna göre sıralanır (table: önce isim → masa, sonra fiil → ertelemek)
//    - bir türün içinde, kelimenin daha çok anlamında geçen ve Türkçede daha yaygın olan karşılık öne çıkar
//      (eski/nadir kelimeler, ör. "baylanlık", geriye düşer)
const POS_ORDER = 'nvar';
const PER_POS = 4;
const plain = (t) => t.replace(/[âîû]/g, (c) => ({ â: 'a', î: 'i', û: 'u' })[c]);

// Türkçe kelime sıklığı (0 = en yaygın). Mastarlar altyazıda nadir geçer; fiilin yaygınlığı çekimli
// biçimlerinden (artıyor, arttı, artar...) ölçülür. Çok kelimeli karşılıkta en seyrek kelime belirleyicidir.
const freqRank = new Map(
  JSON.parse(fs.readFileSync(path.resolve('node_modules/@zxcvbn-ts/language-tr/src/commonWords.json'), 'utf8')).map((w, i) => [w, i]),
);
const VERB_FORMS = ['ıyor', 'iyor', 'uyor', 'üyor', 'yor', 'dı', 'di', 'du', 'dü', 'tı', 'ti', 'tu', 'tü', 'ar', 'er', 'ır', 'ir', 'ur', 'ür', 'r', 'mak', 'mek', 'ma', 'me', 'sın', 'sin'];
function wordRank(w) {
  if (freqRank.has(w)) return freqRank.get(w);
  const stem = w.match(/^(.{2,})m[ae]k$/)?.[1];
  if (!stem) return Infinity;
  return Math.min(...VERB_FORMS.map((f) => freqRank.get(stem + f) ?? Infinity));
}
const rank = (t) => Math.max(...t.split(' ').map(wordRank));
// Yaygınlık puanı: en yaygın kelimelerde ~1.5, listede olmayan (eski/nadir) kelimelerde 0.
const commonness = (t) => (Number.isFinite(rank(t)) ? 1.5 - Math.log10(rank(t) + 1) / 3 : 0);

const dict = {};
for (const [en, senses] of enWords) {
  if (!wanted(en)) continue;
  const byPos = {};
  for (const { id, pos } of senses) {
    byPos[pos] ??= { senses: 0, count: new Map() };
    byPos[pos].senses++;
    // Aynı karşılık bir anlamda iki kez geçse de bir sayılır.
    for (const t of new Set(toTr.get(id) ?? [])) byPos[pos].count.set(t, (byPos[pos].count.get(t) ?? 0) + 1);
  }
  const parts = Object.entries(byPos)
    .filter(([, v]) => v.count.size)
    .sort(([a, x], [b, y]) => y.senses - x.senses || POS_ORDER.indexOf(a) - POS_ORDER.indexOf(b))
    .map(([pos, v]) => {
      const meanings = [...v.count.entries()]
        .sort((a, b) => b[1] + commonness(b[0]) - (a[1] + commonness(a[0])))
        .map(([t]) => t)
        // "fedakarlık etmek" / "fedakârlık etmek" gibi yalnızca şapkada ayrılan tekrarları at
        .filter((t, i, all) => all.findIndex((x) => plain(x) === plain(t)) === i)
        .slice(0, PER_POS);
      return `${pos}:${meanings.join(';')}`;
    });
  // Biçim: "n:masa;tablo|v:ertelemek;atmak" — tür, formdaki kelime türü alanını da doldurabilsin diye
  if (parts.length) dict[en] = parts.join('|');
}

fs.writeFileSync(OUT, JSON.stringify(dict));
console.log(`${Object.keys(dict).length} kelime → ${OUT} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
