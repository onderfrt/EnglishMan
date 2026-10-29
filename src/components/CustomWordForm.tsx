import { useState } from 'react';
import { POS_TR, type Level, type PartOfSpeech, type Word } from '../data/words';
import {
  EMPTY_INPUT,
  findDuplicate,
  newCustomId,
  toCustomWord,
  toInput,
  type CustomWordInput,
} from '../lib/customWords';
import { findInSentence } from '../lib/exam';
import { removeUserImage } from '../lib/images';
import { useBack } from '../lib/back';
import { BackBar } from './BackBar';
import { DictionaryHints } from './DictionaryHints';
import { WordAutocomplete } from './WordAutocomplete';
import { curatedSense, looksPhrasal } from '../lib/phrasal';
import { WordDetails } from './WordDetails';

interface Props {
  /** Düzenlenen kelime; yoksa yeni kelime eklenir. */
  word?: Word;
  /** Yeni kelimede önceden doldurulacak İngilizce kelime (ana sayfadaki hızlı ekleme). */
  initialEn?: string;
  /** Phrasal verb'lerim bölümünden açıldı: tür baştan "phrasal verb", öneriler phrasal verb listesinden gelir. */
  phrasal?: boolean;
  level: Level;
  onSave: (word: Word) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const POS_OPTIONS: [PartOfSpeech, string][] = [
  ['other', 'Bilmiyorum / diğer'],
  ...(Object.entries(POS_TR) as [PartOfSpeech, string][]).filter(([p]) => p !== 'other'),
];

export function CustomWordForm({ word, initialEn, phrasal = false, level, onSave, onDelete, onCancel }: Props) {
  const [id] = useState(() => word?.id ?? newCustomId());
  const [input, setInput] = useState<CustomWordInput>(() =>
    word ? toInput(word) : { ...EMPTY_INPUT, en: initialEn ?? '', ...(phrasal && { pos: 'phrasal verb' as const }) },
  );
  const [tried, setTried] = useState(false);

  const set = (patch: Partial<CustomWordInput>) => setInput((i) => ({ ...i, ...patch }));
  const preview = toCustomWord(input, id, word?.level ?? level);
  const valid = !!preview.en && !!preview.tr;
  const duplicate = preview.en ? findDuplicate(preview.en, id) : undefined;
  const clozeReady = !preview.example || !!findInSentence(preview, preview.example);

  const save = () => {
    setTried(true);
    if (valid) onSave(preview);
  };

  const cancel = () => {
    // Yeni kelimeye eklenip kaydedilmeyen görsel geride kalmasın.
    if (!word) removeUserImage(id);
    onCancel();
  };

  useBack(true, cancel);

  return (
    <div className="viewer custom-form">
      <BackBar title={phrasal ? (word ? 'Phrasal verb’ü düzenle' : 'Yeni phrasal verb') : word ? 'Kelimeyi düzenle' : 'Yeni kelime'} />
      <div className="card">

        <div className="field">
          <span>{phrasal ? 'Phrasal verb *' : 'İngilizce kelime *'}</span>
          <WordAutocomplete
            value={input.en}
            invalid={tried && !preview.en}
            onChange={(en) => set({ en })}
            phrasal={phrasal}
            placeholder={phrasal ? 'ör. give up, look forward to' : undefined}
            onPick={(en, known, meaning) =>
              // Uygulamada olan bir kelime seçildiyse boş alanları onun bilgileriyle doldur.
              setInput((i) =>
                known
                  ? {
                      ...i,
                      en,
                      tr: i.tr || known.tr,
                      example: i.example || known.example,
                      exampleTr: i.exampleTr || known.exampleTr,
                      synonyms: i.synonyms || (known.synonyms ?? []).join(', '),
                      pos: i.pos === 'other' ? known.pos : i.pos,
                      emoji: i.emoji || known.emoji,
                    }
                  : { ...i, en, tr: i.tr || meaning || '' },
              )
            }
          />
        </div>
        {!phrasal && input.pos !== 'phrasal verb' && looksPhrasal(input.en) && (
          <p className="notice small phrasal-notice">
            “{input.en.trim()}” bir phrasal verb’e benziyor.
            <button type="button" className="chip-btn" onClick={() => set({ pos: 'phrasal verb' })}>
              Phrasal verb’lerime ekle
            </button>
          </p>
        )}
        {(phrasal ? input.pos !== 'phrasal verb' : input.pos === 'phrasal verb') && (
          <p className="small muted">
            {phrasal
              ? 'Türü phrasal verb olmadığı için kaydedince Kelimelerim bölümünde görünecek.'
              : 'Kaydedince Phrasal verb’lerim bölümünde görünecek.'}
          </p>
        )}
        {duplicate && (
          <p className="notice small">
            Bu kelime uygulamada zaten var{duplicate.custom ? ' (kendi kelimelerinde)' : ''}: “{duplicate.tr}”. Yine de
            ekleyebilirsin.
          </p>
        )}

        <label className="field">
          <span>Türkçe anlamı *</span>
          <input
            value={input.tr}
            onChange={(e) => set({ tr: e.target.value })}
            placeholder={phrasal ? 'ör. vazgeçmek' : 'ör. terk etmek'}
            className={tried && !preview.tr ? 'invalid' : ''}
          />
        </label>
        <DictionaryHints
          en={input.en}
          tr={input.tr}
          extra={phrasal || input.pos === 'phrasal verb' ? curatedSense(input.en) : undefined}
          onToggle={(meaning, pos) =>
            setInput((i) => {
              const list = i.tr.split(',').map((x) => x.trim()).filter(Boolean);
              const has = list.some((x) => x.toLocaleLowerCase('tr') === meaning.toLocaleLowerCase('tr'));
              const next = has ? list.filter((x) => x.toLocaleLowerCase('tr') !== meaning.toLocaleLowerCase('tr')) : [...list, meaning];
              return { ...i, tr: next.join(', '), pos: i.pos === 'other' && !has ? pos : i.pos };
            })
          }
        />

        <label className="field">
          <span>Örnek cümle</span>
          <textarea
            rows={2}
            value={input.example}
            onChange={(e) => set({ example: e.target.value })}
            placeholder={phrasal ? 'ör. Don’t give up on your dreams.' : 'ör. They had to abandon the car.'}
            autoCapitalize="sentences"
            spellCheck={false}
          />
          {!clozeReady && (
            <small className="warn-text">
              {input.pos === 'phrasal verb'
                ? 'Phrasal verb bu cümlede bitişik ve aynen (ya da -s, -ing ekiyle) geçmiyor (ör. “gave up” ya da “give it up”); bunun için boşluk doldurma sorusu çıkmaz, diğer sorular çıkar.'
                : 'Kelime bu cümlede aynen (ya da -s, -ed, -ing ekiyle) geçmiyor; bu kelime için boşluk doldurma sorusu çıkmaz.'}
            </small>
          )}
        </label>

        <label className="field">
          <span>Örnek cümlenin Türkçesi</span>
          <textarea
            rows={2}
            value={input.exampleTr}
            onChange={(e) => set({ exampleTr: e.target.value })}
            placeholder={phrasal ? 'ör. Hayallerinden vazgeçme.' : 'ör. Arabayı terk etmek zorunda kaldılar.'}
          />
        </label>

        <details className="more-fields" open={!!(word && (input.synonyms || input.pos !== 'other' || input.emoji))}>
          <summary>Daha fazla: tür, eş anlamlılar, emoji</summary>
          <label className="field">
            <span>Kelime türü</span>
            <select value={input.pos} onChange={(e) => set({ pos: e.target.value as PartOfSpeech })}>
              {POS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Eş anlamlılar (virgülle ayır)</span>
            <input
              value={input.synonyms}
              onChange={(e) => set({ synonyms: e.target.value })}
              placeholder="ör. leave, desert"
              autoCapitalize="off"
              spellCheck={false}
            />
            <small className="muted">En az iki eş anlamlı eklersen “anlamca en yakın” soruları da çıkar.</small>
          </label>
          <label className="field">
            <span>Emoji</span>
            <input
              value={input.emoji}
              onChange={(e) => set({ emoji: e.target.value })}
              placeholder="ör. 🚗💨 (telefonunun emoji klavyesinden)"
            />
          </label>
        </details>
      </div>

      <div className="card">
        <p className="prompt">Önizleme · fotoğraf eklemek için görselin altındaki bağlantıyı kullan</p>
        <WordDetails word={preview} editable extras={false} />
      </div>

      <div className="form-actions">
        <button className="btn" onClick={cancel}>
          Vazgeç
        </button>
        <button className="btn btn-primary" onClick={save} disabled={tried && !valid}>
          {word ? 'Kaydet' : 'Ekle'}
        </button>
      </div>
      {tried && !valid && <p className="small error center">İngilizce kelime ve Türkçe anlamı zorunlu.</p>}

      {word && onDelete && (
        <button
          className="btn btn-danger btn-block"
          onClick={() => confirm(`“${word.en}” ve ilerlemesi silinecek. Emin misin?`) && onDelete()}
        >
          🗑️ {phrasal ? 'Phrasal verb’ü sil' : 'Kelimeyi sil'}
        </button>
      )}
    </div>
  );
}
