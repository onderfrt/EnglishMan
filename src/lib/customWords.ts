import type { Level, PartOfSpeech, Word } from '../data/words';
import { allWords, customWords } from './catalog';

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
/** Emojisi girilmemiş phrasal verb'lerin görseli. */
export const DEFAULT_PHRASAL_EMOJI = '🧩';

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
    emoji: clean(input.emoji) || (input.pos === 'phrasal verb' ? DEFAULT_PHRASAL_EMOJI : DEFAULT_EMOJI),
    example: clean(input.example),
    exampleTr: clean(input.exampleTr),
    topic: 'custom',
    level,
    ...(synonyms.length && { synonyms }),
    custom: true,
    updatedAt: Date.now(),
  };
}

export function toInput(w: Word): CustomWordInput {
  return {
    en: w.en,
    tr: w.tr,
    pos: w.pos,
    emoji: w.emoji === DEFAULT_EMOJI || w.emoji === DEFAULT_PHRASAL_EMOJI ? '' : w.emoji,
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

export type ImportStatus = 'new' | 'update' | 'unchanged' | 'builtin' | 'repeat' | 'invalid' | 'notphrasal';

export interface ImportRow {
  line: number;
  input: CustomWordInput;
  status: ImportStatus;
  /** Uygulamada aynı İngilizce kelime (kendi kelimen ya da hazır kelime). */
  existing?: Word;
  /** "update" satırında değişecek alanlar. */
  changes?: Partial<Pick<CustomWordInput, 'tr' | 'example' | 'exampleTr' | 'pos'>>;
  /** Anlam satırda yoktu, sözlükten önerildi. */
  autoMeaning?: boolean;
}

/** Güncellenebilen alanlar ve önizlemede görünen adları. */
export const UPDATABLE = { tr: 'anlam', example: 'örnek cümle', exampleTr: 'çeviri' } as const;
/** Önizlemede değişen alanların adları (tür yalnızca Phrasal verb'lerim'e yüklerken değişir). */
export const CHANGE_LABELS: Record<keyof NonNullable<ImportRow['changes']>, string> = { ...UPDATABLE, pos: 'phrasal verb’lerine taşınır' };

/** Kendi kelimeye dosyadaki dolu alanları uygular (boş alanlar mevcut değeri korur). */
export function applyChanges(word: Word, changes: ImportRow['changes']): Word {
  return { ...word, ...changes, updatedAt: Date.now() };
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

const HEADER = /^(word|kelime|ingilizce|english|term|phrasal)\b/i;

/**
 * @param meaningFor Anlamı boş satırlar için sözlük önerisi (yalnızca İngilizce kelimelerden oluşan listeler için).
 * @param pos Tüm satırlara verilecek tür (Phrasal verb'lerim'e yüklerken "phrasal verb"); kendi kelimelerinde başka
 *   türle kayıtlı olanlar da bu türe geçer.
 */
export function parseImport(text: string, meaningFor?: (en: string) => string, pos?: PartOfSpeech): ImportRow[] {
  const seen = new Set<string>();
  const ownByEn = new Map(customWords().map((w) => [w.en.toLowerCase(), w]));
  const rows: ImportRow[] = [];
  text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .forEach((raw, i) => {
      if (!raw.trim()) return;
      const [en = '', tr = '', example = '', exampleTr = ''] = splitLine(raw).map(clean);
      if (i === 0 && HEADER.test(en)) return; // Başlık satırı
      const key = en.toLowerCase();
      const input: CustomWordInput = { ...EMPTY_INPUT, en, tr, example, exampleTr, ...(pos && { pos }) };
      const line = i + 1;
      if (!en) return rows.push({ line, input, status: 'invalid' });
      if (seen.has(key)) return rows.push({ line, input, status: 'repeat' });
      seen.add(key);
      // Phrasal verb'lerim'e tek kelime (ör. abolish) eklenmez; Kelimelerim'deki aynı kelimeye de dokunulmaz.
      if (pos === 'phrasal verb' && !key.includes(' ')) return rows.push({ line, input, status: 'notphrasal' });

      // Kendi kelimelerinde varsa: dosyadaki dolu ve farklı alanlar güncellenir (ör. sonradan örnek cümle eklemek).
      const own = ownByEn.get(key);
      if (own) {
        const changes: ImportRow['changes'] = {};
        for (const f of Object.keys(UPDATABLE) as (keyof typeof UPDATABLE)[]) {
          if (input[f] && input[f] !== own[f]) changes[f] = input[f];
        }
        if (pos && own.pos !== pos) changes.pos = pos;
        const status = Object.keys(changes).length ? 'update' : 'unchanged';
        return rows.push({ line, input, status, existing: own, ...(status === 'update' && { changes }) });
      }

      const builtin = findDuplicate(en);
      if (builtin) return rows.push({ line, input, status: 'builtin', existing: builtin });

      // Yeni kelime: anlam yoksa sözlükten önerilir.
      const auto = !tr && meaningFor ? meaningFor(en) : '';
      if (!tr && !auto) return rows.push({ line, input, status: 'invalid' });
      rows.push({ line, input: { ...input, tr: tr || auto }, status: 'new', ...(auto && { autoMeaning: true }) });
    });
  return rows;
}

/** Excel'in Türkçe ayarlarında doğru açılması için noktalı virgüllü, UTF-8 BOM'lu şablon. */
export function importTemplate(phrasal = false): string {
  if (phrasal)
    return (
      '\uFEFF' +
      [
        'phrasal verb;anlam;örnek cümle;cümlenin çevirisi',
        "give up;vazgeçmek;Don't give up on your dreams.;Hayallerinden vazgeçme.",
        'put off;ertelemek;We had to put off the meeting.;Toplantıyı ertelemek zorunda kaldık.',
        'come up with;(fikir) bulmak;;',
      ].join('\r\n')
    );
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
