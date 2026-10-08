import { useState } from 'react';
import { TOPICS, WORDS, type TopicId } from '../data/words';
import { formatDue, isMastered, type CardState } from '../lib/srs';
import type { Progress } from '../lib/storage';
import { SpeakButton } from './Speak';
import { WordDetails } from './WordDetails';

type Filter = 'all' | 'new' | 'learning' | 'mastered';

function status(card: CardState | undefined): Exclude<Filter, 'all'> {
  if (!card) return 'new';
  return isMastered(card) ? 'mastered' : 'learning';
}

const STATUS_LABEL = { new: 'Yeni', learning: 'Öğreniliyor', mastered: 'Kalıcı' };

export function WordList({ progress, now }: { progress: Progress; now: number }) {
  const [topic, setTopic] = useState<TopicId | 'all'>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const list = WORDS.filter(
    (w) =>
      (topic === 'all' || w.topic === topic) &&
      (filter === 'all' || status(progress.cards[w.id]) === filter) &&
      (!q || w.en.includes(q) || w.tr.toLowerCase().includes(q)),
  );

  return (
    <div className="word-list">
      <input className="search" placeholder="🔎 Kelime ara (İngilizce ya da Türkçe)" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="filters">
        <select value={topic} onChange={(e) => setTopic(e.target.value as TopicId | 'all')}>
          <option value="all">Tüm konular</option>
          {(Object.keys(TOPICS) as TopicId[]).map((id) => (
            <option key={id} value={id}>
              {TOPICS[id].emoji} {TOPICS[id].name}
            </option>
          ))}
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="all">Tüm durumlar</option>
          <option value="new">Yeni</option>
          <option value="learning">Öğreniliyor</option>
          <option value="mastered">Kalıcı</option>
        </select>
      </div>
      <p className="muted small">{list.length} kelime</p>
      <ul>
        {list.map((w) => {
          const card = progress.cards[w.id];
          const st = status(card);
          return (
            <li key={w.id} className="word-row">
              <button className="word-row-main" onClick={() => setOpen(open === w.id ? null : w.id)}>
                <span className="row-emoji">{w.emoji}</span>
                <span className="row-text">
                  <b>{w.en}</b>
                  <span className="muted">{w.tr}</span>
                </span>
                <span className={`status status-${st}`}>{STATUS_LABEL[st]}</span>
              </button>
              <SpeakButton text={w.en} />
              {open === w.id && (
                <div className="row-details">
                  <WordDetails word={w} note={progress.notes[w.id]} />
                  {card && (
                    <p className="muted small center">
                      Sonraki tekrar: {formatDue(card.due, now)} ·{' '}
                      {card.lapses} kez unutuldu
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
