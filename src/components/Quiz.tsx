import { useEffect, useMemo, useRef, useState } from 'react';
import { type Word } from '../data/words';
import { checkTyped, type TypedResult } from '../lib/answer';
import { clozeQuestion, synonymQuestion, type ClozeQuestion } from '../lib/exam';
import { choicesFor, type QuizMode } from '../lib/session';
import { SLOW_RATE, speak } from '../lib/speech';
import { SpeakButton } from './Speak';
import { WordDetails } from './WordDetails';
import { WordVisual } from './WordVisual';

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
  cloze: 'Boşluğa en uygun kelimeyi seç',
  synonym: 'Anlamca en yakın olanı seç',
};

interface Option {
  key: string;
  label: string;
  correct: boolean;
}

const LETTERS = 'ABCDE';

export function Quiz({ word, mode: requestedMode, note, autoSpeak, onAnswer, onNext }: Props) {
  const [result, setResult] = useState<TypedResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [hint, setHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // YDS tarzı sorular üretilemezse (ör. cümlede düzensiz biçim) klasik soruya dönülür.
  const exam = useMemo(
    () =>
      requestedMode === 'cloze' ? clozeQuestion(word) : requestedMode === 'synonym' ? synonymQuestion(word) : null,
    [word.id, requestedMode],
  );
  const mode: QuizMode = (requestedMode === 'cloze' || requestedMode === 'synonym') && !exam ? 'choice-tr-en' : requestedMode;
  const isExamMode = mode === 'cloze' || mode === 'synonym';
  const cloze = mode === 'cloze' ? (exam as ClozeQuestion) : null;

  const options: Option[] = useMemo(() => {
    if (exam) return exam.options.map((o) => ({ key: o, label: o, correct: o === exam.answer }));
    return choicesFor(word).map((w) => ({
      key: w.id,
      label: mode === 'choice-tr-en' ? w.en : w.tr,
      correct: w.id === word.id,
    }));
  }, [word.id, mode, exam]);
  const isListen = mode === 'listen-choice' || mode === 'listen-type';
  const isTyping = mode === 'type-tr-en' || mode === 'listen-type';

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

  const choose = (o: Option) => {
    if (result) return;
    setSelected(o.key);
    answer(o.correct ? 'correct' : 'wrong');
  };

  const submitTyped = () => {
    if (result) return;
    // İpucu kullanıldıysa doğru cevap bile "zor" sayılır.
    const r = checkTyped(typed, word.en);
    answer(hint && r === 'correct' ? 'typo' : r);
  };

  // Klavye kısayolları: 1-5 ya da A-E şık seçer, Enter devam eder.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result && e.key === 'Enter' && document.activeElement !== nextRef.current) {
        e.preventDefault();
        onNext();
      } else if (!result && !isTyping && /^[1-5a-e]$/i.test(e.key)) {
        const i = /\d/.test(e.key) ? Number(e.key) - 1 : LETTERS.indexOf(e.key.toUpperCase());
        const opt = options[i];
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
              <WordVisual word={word} small />
              <div className="word-line">
                <span className="word-en">{word.en}</span>
                <SpeakButton text={word.en} />
              </div>
            </>
          )}
          {(mode === 'choice-tr-en' || mode === 'type-tr-en') && (
            <>
              <WordVisual word={word} small />
              <div className="word-tr big">{word.tr}</div>
            </>
          )}
          {cloze && (
            <p className="cloze-sentence">
              {cloze.before}
              <span className="blank">_____</span>
              {cloze.after}
            </p>
          )}
          {cloze && <p className="cloze-translation">🇹🇷 {cloze.translation}</p>}
          {mode === 'synonym' && (
            <div className="word-line">
              <span className="word-en">{word.en}</span>
              <SpeakButton text={word.en} />
            </div>
          )}
          {isListen && (
            <button className="listen-big" onClick={() => speak(word.en)} aria-label="Tekrar dinle">
              🔊
              <span>Tekrar dinle</span>
            </button>
          )}
          {isListen && (
            <button className="link-btn" onClick={() => speak(word.en, SLOW_RATE)}>
              🐢 Yavaş dinle
            </button>
          )}
        </div>
      )}

      {result && cloze && (
        <p className="cloze-sentence">
          {cloze.before}
          <mark>{cloze.answer}</mark>
          {cloze.after}
        </p>
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
            const state = !result ? '' : o.correct ? 'opt-correct' : o.key === selected ? 'opt-wrong' : 'opt-dim';
            return (
              <button key={o.key} className={`option ${state}`} onClick={() => choose(o)} disabled={!!result}>
                <span className="opt-key">{isExamMode ? LETTERS[i] : i + 1}</span>
                {o.label}
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
          <button ref={nextRef} className="btn btn-primary btn-block sticky-action" onClick={onNext}>
            Devam →
          </button>
        </>
      )}
    </div>
  );
}
