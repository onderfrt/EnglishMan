import { useEffect, useMemo, useRef, useState } from 'react';
import { type Word } from '../data/words';
import { checkTyped, type TypedResult } from '../lib/answer';
import { choicesFor, type QuizMode } from '../lib/session';
import { speak } from '../lib/speech';
import { SpeakButton } from './Speak';
import { WordDetails } from './WordDetails';

interface Props {
  word: Word;
  mode: QuizMode;
  note?: string;
  autoSpeak: boolean;
  onAnswer: (result: TypedResult) => void;
  onNext: () => void;
}

const PROMPTS: Record<QuizMode, string> = {
  'choice-en-tr': 'Bu kelimenin anlamı ne?',
  'choice-tr-en': 'Bunun İngilizcesi hangisi?',
  'listen-choice': 'Duyduğun kelimenin anlamı ne?',
  'type-tr-en': 'İngilizcesini yaz',
  'listen-type': 'Duyduğun kelimeyi yaz',
};

export function Quiz({ word, mode, note, autoSpeak, onAnswer, onNext }: Props) {
  const [result, setResult] = useState<TypedResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [hint, setHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const options = useMemo(() => choicesFor(word), [word.id, mode]);
  const isListen = mode === 'listen-choice' || mode === 'listen-type';
  const isTyping = mode === 'type-tr-en' || mode === 'listen-type';
  const showEnglishOptions = mode === 'choice-tr-en';

  useEffect(() => {
    setResult(null);
    setSelected(null);
    setTyped('');
    setHint(false);
    if (isListen) speak(word.en);
    else if (mode === 'choice-en-tr' && autoSpeak) speak(word.en);
    if (isTyping) setTimeout(() => inputRef.current?.focus(), 50);
  }, [word.id, mode]);

  const answer = (r: TypedResult) => {
    setResult(r);
    onAnswer(r);
    if (autoSpeak && !isListen) speak(word.en);
    setTimeout(() => nextRef.current?.focus(), 50);
  };

  const choose = (w: Word) => {
    if (result) return;
    setSelected(w.id);
    answer(w.id === word.id ? 'correct' : 'wrong');
  };

  const submitTyped = () => {
    if (result) return;
    // İpucu kullanıldıysa doğru cevap bile "zor" sayılır.
    const r = checkTyped(typed, word.en);
    answer(hint && r === 'correct' ? 'typo' : r);
  };

  // Klavye kısayolları: 1-4 şık seçer, Enter devam eder.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result && e.key === 'Enter' && document.activeElement !== nextRef.current) {
        e.preventDefault();
        onNext();
      } else if (!result && !isTyping && /^[1-4]$/.test(e.key)) {
        const opt = options[Number(e.key) - 1];
        if (opt) choose(opt);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="card">
      <div className="prompt">{PROMPTS[mode]}</div>

      {!result && (
        <div className="question">
          {mode === 'choice-en-tr' && (
            <>
              <div className="emoji-visual small" aria-hidden>
                {word.emoji}
              </div>
              <div className="word-line">
                <span className="word-en">{word.en}</span>
                <SpeakButton text={word.en} />
              </div>
            </>
          )}
          {(mode === 'choice-tr-en' || mode === 'type-tr-en') && (
            <>
              <div className="emoji-visual small" aria-hidden>
                {word.emoji}
              </div>
              <div className="word-tr big">{word.tr}</div>
            </>
          )}
          {isListen && (
            <button className="listen-big" onClick={() => speak(word.en)} aria-label="Tekrar dinle">
              🔊
              <span>Tekrar dinle</span>
            </button>
          )}
          {isListen && (
            <button className="link-btn" onClick={() => speak(word.en, 0.5)}>
              🐢 Yavaş dinle
            </button>
          )}
        </div>
      )}

      {result && (
        <div className={`feedback feedback-${result}`}>
          {result === 'correct' && '✅ Doğru!'}
          {result === 'typo' && (hint ? '🟡 İpucuyla doğru' : `🟡 Neredeyse! Küçük bir yazım hatası: "${typed.trim()}"`)}
          {result === 'wrong' && (isTyping && typed.trim() ? `❌ Senin cevabın: "${typed.trim()}"` : '❌ Yanlış')}
        </div>
      )}

      {!isTyping && (
        <div className="options">
          {options.map((o, i) => {
            const state = !result ? '' : o.id === word.id ? 'opt-correct' : o.id === selected ? 'opt-wrong' : 'opt-dim';
            return (
              <button key={o.id} className={`option ${state}`} onClick={() => choose(o)} disabled={!!result}>
                <span className="opt-key">{i + 1}</span>
                {showEnglishOptions ? o.en : o.tr}
              </button>
            );
          })}
        </div>
      )}

      {isTyping && !result && (
        <form
          className="type-form"
          onSubmit={(e) => {
            e.preventDefault();
            submitTyped();
          }}
        >
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            placeholder={hint ? word.en.replace(/[a-z]/gi, (c, i) => (i === 0 ? c : '_')) : 'Cevabını yaz...'}
          />
          <div className="row">
            <button type="button" className="btn" onClick={() => setHint(true)} disabled={hint}>
              💡 İpucu
            </button>
            <button type="button" className="btn" onClick={() => answer('wrong')}>
              Bilmiyorum
            </button>
            <button type="submit" className="btn btn-primary" disabled={!typed.trim()}>
              Kontrol et
            </button>
          </div>
          {hint && (
            <div className="hint">
              {word.en.replace(/ /g, '').length} harf, “{word.en[0]}” ile başlıyor
              {note ? ` · 💭 ${note}` : ''}
            </div>
          )}
        </form>
      )}

      {result && (
        <>
          <WordDetails word={word} note={note} />
          <button ref={nextRef} className="btn btn-primary btn-block" onClick={onNext}>
            Devam →
          </button>
        </>
      )}
    </div>
  );
}
