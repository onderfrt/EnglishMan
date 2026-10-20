import { useEffect, useState } from 'react';
import { POS_TR, type PartOfSpeech } from '../data/words';
import { loadDictionary, lookup } from '../lib/dictionary';

interface Props {
  en: string;
  /** Formdaki Türkçe anlam (virgülle ayrılmış). */
  tr: string;
  onToggle: (meaning: string, pos: PartOfSpeech) => void;
}

const split = (tr: string) =>
  tr
    .split(',')
    .map((x) => x.trim().toLocaleLowerCase('tr'))
    .filter(Boolean);

/** Türkçe anlam alanının altında sözlük önerileri: dokununca eklenir, tekrar dokununca çıkar. */
export function DictionaryHints({ en, tr, onToggle }: Props) {
  const [dict, setDict] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    loadDictionary().then(setDict);
  }, []);

  const senses = lookup(en, dict);
  if (!senses.length) return null;
  const chosen = split(tr);

  return (
    <div className="dict-hints">
      <span className="muted small">📖 Sözlük önerileri · dokunarak ekle (otomatik eşleştirme, kontrol et)</span>
      {senses.map((s) => (
        <div key={s.pos} className="dict-row">
          <span className="dict-pos">{POS_TR[s.pos]}</span>
          {s.meanings.map((m) => {
            const on = chosen.includes(m.toLocaleLowerCase('tr'));
            return (
              <button key={m} type="button" className={`chip ${on ? 'chip-on' : ''}`} aria-pressed={on} onClick={() => onToggle(m, s.pos)}>
                {on ? '✓ ' : '+ '}
                {m}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
