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
import { WordDetails } from './WordDetails';

interface Props {
  /** Düzenlenen kelime; yoksa yeni kelime eklenir. */
  word?: Word;
  level: Level;
  onSave: (word: Word) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const POS_OPTIONS: [PartOfSpeech, string][] = [
  ['other', 'Bilmiyorum / diğer'],
  ...(Object.entries(POS_TR) as [PartOfSpeech, string][]).filter(([p]) => p !== 'other'),
];

export function CustomWordForm({ word, level, onSave, onDelete, onCancel }: Props) {
  const [id] = useState(() => word?.id ?? newCustomId());
  const [input, setInput] = useState<CustomWordInput>(() => (word ? toInput(word) : EMPTY_INPUT));
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

  return (
    <div className="custom-form">
      <div className="card">
        <h2>{word ? 'Kelimeyi düzenle' : 'Yeni kelime ekle'}</h2>

        <label className="field">
          <span>İngilizce kelime *</span>
          <input
            value={input.en}
            onChange={(e) => set({ en: e.target.value })}
            placeholder="ör. abandon ya da give up"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={tried && !preview.en ? 'invalid' : ''}
          />
        </label>
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
            placeholder="ör. terk etmek"
            className={tried && !preview.tr ? 'invalid' : ''}
          />
        </label>

        <label className="field">
          <span>Örnek cümle</span>
          <textarea
            rows={2}
            value={input.example}
            onChange={(e) => set({ example: e.target.value })}
            placeholder="ör. They had to abandon the car."
            autoCapitalize="sentences"
            spellCheck={false}
          />
          {!clozeReady && (
            <small className="warn-text">
              Kelime bu cümlede aynen (ya da -s, -ed, -ing ekiyle) geçmiyor; bu kelime için boşluk doldurma sorusu çıkmaz.
            </small>
          )}
        </label>

        <label className="field">
          <span>Örnek cümlenin Türkçesi</span>
          <textarea
            rows={2}
            value={input.exampleTr}
            onChange={(e) => set({ exampleTr: e.target.value })}
            placeholder="ör. Arabayı terk etmek zorunda kaldılar."
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
        <WordDetails word={preview} editable />
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
          🗑️ Kelimeyi sil
        </button>
      )}
    </div>
  );
}
