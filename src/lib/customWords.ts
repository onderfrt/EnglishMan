import type { Level, PartOfSpeech, Word } from '../data/words';
import { allWords } from './catalog';

/** Kullanıcının bir kelime için doldurduğu alanlar. */
export interface CustomWordInput {
  en: string;
  tr: string;
  pos: PartOfSpeech;
  emoji: string;
  example: string;
  exampleTr: string;
  /** Virgülle ayrılmış eş anlamlılar. */
  synonyms: string;
}

export const DEFAULT_EMOJI = '📝';

export const EMPTY_INPUT: CustomWordInput = { en: '', tr: '', pos: 'other', emoji: '', example: '', exampleTr: '', synonyms: '' };

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

export function newCustomId(): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `custom:${rand}`;
}

/**
 * Formdaki alanlardan kelime oluşturur. Seviye arayüzde gösterilmez; yalnızca yanlış şıkların
 * yakın zorlukta seçilmesi için kullanıcının seviyesinden alınır.
 */
export function toCustomWord(input: CustomWordInput, id: string, level: Level): Word {
  const synonyms = input.synonyms
    .split(',')
    .map(clean)
    .filter((x) => x && x.toLowerCase() !== clean(input.en).toLowerCase());
  return {
    id,
    en: clean(input.en),
    tr: clean(input.tr),
    pos: input.pos,
    emoji: clean(input.emoji) || DEFAULT_EMOJI,
    example: clean(input.example),
    exampleTr: clean(input.exampleTr),
    topic: 'custom',
    level,
    ...(synonyms.length && { synonyms }),
    custom: true,
  };
}

export function toInput(w: Word): CustomWordInput {
  return {
    en: w.en,
    tr: w.tr,
    pos: w.pos,
    emoji: w.emoji === DEFAULT_EMOJI ? '' : w.emoji,
    example: w.example,
    exampleTr: w.exampleTr,
    synonyms: (w.synonyms ?? []).join(', '),
  };
}

/** Aynı İngilizce kelime uygulamada zaten var mı? (Düzenlenen kelimenin kendisi hariç.) */
export function findDuplicate(en: string, exceptId?: string): Word | undefined {
  const key = clean(en).toLowerCase();
  return allWords().find((w) => w.id !== exceptId && w.en.toLowerCase() === key);
}

// ---------- Toplu içe aktarma ----------

export interface ImportRow {
  line: number;
  input: CustomWordInput;
  status: 'new' | 'duplicate' | 'invalid';
  /** Kopya ise uygulamada var olan kelime. */
  existing?: Word;
  /** Anlam satırda yoktu, sözlükten önerildi. */
  autoMeaning?: boolean;
}

/** "a,b,"c, d"" gibi tırnaklı CSV satırını ayırır. */
function splitCsv(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"' && cur.trim() === '') {
      quoted = true;
      cur = '';
    } else if (ch === sep) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * Bir satırı alanlara ayırır. Desteklenen biçimler:
 * - Sekme (Excel / Google Sheets'ten kopyala-yapıştır, Quizlet ve Anki dışa aktarımı)
 * - Noktalı virgül:  kelime ; anlam ; örnek cümle ; cümlenin çevirisi
 * - Tire ya da eşittir (yalnızca kelime ve anlam):  abandon - terk etmek
 * - Virgül (CSV dosyası; virgül içeren cümleler tırnak içinde olmalı)
 */
export function splitLine(line: string): string[] {
  if (line.includes('\t')) return line.split('\t');
  if (line.includes(';')) return splitCsv(line, ';');
  const dash = line.match(/^(.+?)\s+[-–=:]\s+(.+)$/);
  if (dash) return [dash[1], dash[2]];
  if (line.includes(',')) return splitCsv(line, ',');
  return [line];
}

const HEADER = /^(word|kelime|ingilizce|english|term)\b/i;

/**
 * @param meaningFor Anlamı boş satırlar için sözlük önerisi (yalnızca İngilizce kelimelerden oluşan listeler için).
 */
export function parseImport(text: string, meaningFor?: (en: string) => string): ImportRow[] {
  const seen = new Set<string>();
  const rows: ImportRow[] = [];
  text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .forEach((raw, i) => {
      if (!raw.trim()) return;
      const [en = '', given = '', example = '', exampleTr = ''] = splitLine(raw).map(clean);
      if (i === 0 && HEADER.test(en)) return; // Başlık satırı
      const auto = !given && en && meaningFor ? meaningFor(en) : '';
      const tr = given || auto;
      const input: CustomWordInput = { ...EMPTY_INPUT, en, tr, example, exampleTr };
      const key = en.toLowerCase();
      const existing = findDuplicate(en);
      const status = !en || !tr ? 'invalid' : existing || seen.has(key) ? 'duplicate' : 'new';
      if (status === 'new') seen.add(key);
      rows.push({ line: i + 1, input, status, existing, ...(auto && { autoMeaning: true }) });
    });
  return rows;
}

/** Excel'in Türkçe ayarlarında doğru açılması için noktalı virgüllü, UTF-8 BOM'lu şablon. */
export function importTemplate(): string {
  return (
    '﻿' +
    [
      'kelime;anlam;örnek cümle;cümlenin çevirisi',
      'abandon;terk etmek;They had to abandon the car in the snow.;Arabayı karda terk etmek zorunda kaldılar.',
      'reluctant;isteksiz;He was reluctant to answer.;Cevap vermeye isteksizdi.',
      'notwithstanding;-e rağmen;;',
    ].join('\r\n')
  );
}
