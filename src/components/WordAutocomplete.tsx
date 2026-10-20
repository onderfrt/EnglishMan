import { useEffect, useMemo, useState } from 'react';
import type { Word } from '../data/words';
import { loadWordlist, suggest, type Suggestion } from '../lib/suggest';
import { EmojiArt } from './EmojiArt';

interface Props {
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
  /** Bir öneri seçildi; uygulamada olan bir kelimeyse bilgileri de gelir. */
  onPick: (en: string, word?: Word) => void;
}

/** İngilizce kelime alanı: yazdıkça "im" → important, image… gibi öneriler gösterir. */
export function WordAutocomplete({ value, invalid, onChange, onPick }: Props) {
  const [list, setList] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    loadWordlist().then(setList);
  }, []);

  const items = useMemo(() => (open ? suggest(value, list) : []), [open, value, list]);

  const pick = (s: Suggestion) => {
    onPick(s.en, s.word);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className="autocomplete">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        // Öneriye dokunma, alan odağı kaybetmeden önce işlensin.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!items.length) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => (a + 1) % items.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
          } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault();
            pick(items[active]);
          } else if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="ör. abandon ya da give up"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        className={invalid ? 'invalid' : ''}
        role="combobox"
        aria-expanded={items.length > 0}
        aria-autocomplete="list"
      />
      {items.length > 0 && (
        <ul className="suggestions" role="listbox">
          {items.map((s, i) => (
            <li key={s.en} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={i === active ? 'active' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                {s.word && <EmojiArt emoji={s.word.emoji} />}
                <b>{s.en}</b>
                {s.word ? <span className="muted">{s.word.tr}</span> : null}
                {s.word && <span className="sugg-tag">{s.word.custom ? 'kelimelerinde' : 'bilgileri dolar'}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
