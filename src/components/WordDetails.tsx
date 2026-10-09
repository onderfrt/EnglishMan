import { POS_TR, type Word } from '../data/words';
import { SLOW_RATE } from '../lib/speech';
import { SpeakButton } from './Speak';
import { WordVisual } from './WordVisual';

/** Kelimeyi görsel, telaffuz ve örnek cümle ile birlikte gösteren kart. */
export function WordDetails({ word, note, editable }: { word: Word; note?: string; editable?: boolean }) {
  return (
    <div className="word-details">
      <WordVisual word={word} editable={editable} />
      <div className="word-line">
        <span className="word-en">{word.en}</span>
        <SpeakButton text={word.en} />
        <SpeakButton text={word.en} rate={SLOW_RATE} label="Yavaş dinle" icon="🐢" />
      </div>
      <div className="word-meta">
        <span className={`pos-dot pos-${word.pos.replace(' ', '-')}`} />
        {POS_TR[word.pos]} · {word.level}
      </div>
      <div className="word-tr">{word.tr}</div>
      <div className="example">
        <div className="example-en">
          <Highlighted sentence={word.example} word={word.en} />
          <SpeakButton text={word.example} label="Cümleyi dinle" />
        </div>
        <div className="example-tr">{word.exampleTr}</div>
      </div>
      {note && <div className="note-display">💭 {note}</div>}
    </div>
  );
}

/** Örnek cümlede kelimenin geçtiği yeri (çekimli hâlleri dahil, ör. lent/booked) vurgular. */
function Highlighted({ sentence, word }: { sentence: string; word: string }) {
  const stem = word.split(' ')[0].replace(/e$/, '').slice(0, Math.max(3, word.length - 2));
  const re = new RegExp(`\\b(${escape(stem)}\\w*)`, 'i');
  const m = sentence.match(re);
  if (!m || m.index === undefined) return <span>{sentence}</span>;
  return (
    <span>
      {sentence.slice(0, m.index)}
      <mark>{m[0]}</mark>
      {sentence.slice(m.index + m[0].length)}
    </span>
  );
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
