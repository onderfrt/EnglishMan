import { useState, type ReactNode } from 'react';
import { GOALS, LEVEL_ORDER, LEVELS, PACKS, TOPICS, WORDS, type Level, type PackId, type TopicId, type Word } from '../data/words';
import { isMastered, type CardState } from '../lib/srs';
import type { Progress } from '../lib/storage';
import { EmojiArt } from './EmojiArt';
import { SpeakButton } from './Speak';
import { WordViewer } from './WordViewer';

export type Filter = 'all' | 'learned' | 'new' | 'learning' | 'mastered';
type Status = Exclude<Filter, 'all' | 'learned'>;

export function status(card: CardState | undefined): Status {
  if (!card) return 'new';
  return isMastered(card) ? 'mastered' : 'learning';
}

export const STATUS_LABEL = { new: 'Yeni', learning: 'Öğreniliyor', mastered: 'Kalıcı' };

const FILTERS: [Filter, string][] = [
  ['all', 'Tümü'],
  ['learned', 'Öğrendiklerim'],
  ['new', 'Yeni'],
  ['learning', 'Öğreniliyor'],
  ['mastered', 'Kalıcı'],
];

export function matchesFilter(card: CardState | undefined, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'learned') return !!card;
  return status(card) === filter;
}

/** Durum çipleri (Tümü, Öğrendiklerim, Yeni...). */
export function FilterChips({ value, onChange, children }: { value: Filter; onChange: (f: Filter) => void; children?: ReactNode }) {
  return (
    <div className="chip-row" role="radiogroup" aria-label="Durum">
      {children}
      {FILTERS.map(([f, label]) => (
        <button key={f} role="radio" aria-checked={value === f} className={`filter-chip ${value === f ? 'active' : ''}`} onClick={() => onChange(f)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Liste satırı: görsel, kelime + seviye, anlam, durum ve dinle. */
export function WordRowContent({ word, card, showLevel = true }: { word: Word; card: CardState | undefined; showLevel?: boolean }) {
  const st = status(card);
  return (
    <>
      <span className="row-icon">
        <EmojiArt emoji={word.emoji} />
      </span>
      <span className="row-text">
        <span>
          <b>{word.en}</b>
          {showLevel && !word.custom && <small className="row-level">{word.level}</small>}
        </span>
        <span className="muted">{word.tr}</span>
      </span>
      <span className={`status-dot status-${st}`}>{STATUS_LABEL[st]}</span>
    </>
  );
}

type Source = Level | PackId | `topic:${TopicId}` | 'all';

export function WordList({ progress, now, initialFilter = 'all' }: { progress: Progress; now: number; initialFilter?: Filter }) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const goalPack = progress.settings.goal ? GOALS[progress.settings.goal].pack : null;
  // İlk filtre: paket (ör. Akademik Çekirdek) ya da seviye.
  const [source, setSource] = useState<Source>(goalPack ?? progress.settings.level ?? 'all');
  const packIds = source in PACKS ? new Set(PACKS[source as PackId].words.map((w) => w.id)) : null;
  const topic = source.startsWith('topic:') ? source.slice(6) : null;
  const [query, setQuery] = useState('');
  const [viewing, setViewing] = useState<number | null>(null);

  const q = query.trim().toLowerCase();
  const list = WORDS.filter(
    (w) =>
      (source === 'all' || (packIds ? packIds.has(w.id) : topic ? w.topic === topic : w.level === source)) &&
      matchesFilter(progress.cards[w.id], filter) &&
      (!q || w.en.includes(q) || w.tr.toLowerCase().includes(q) || !!w.synonyms?.some((x) => x.includes(q))),
  );
  const sourceLabel =
    source === 'all' ? 'Tüm kelimeler' : packIds ? PACKS[source as PackId].name : topic ? TOPICS[topic as TopicId].name : source;

  return (
    <div className="word-list">
      <input className="search" type="search" placeholder="Ara: İngilizce ya da Türkçe" value={query} onChange={(e) => setQuery(e.target.value)} />
      <FilterChips value={filter} onChange={setFilter}>
        <label className="filter-chip source-chip">
          {sourceLabel} ▾
          <select value={source} onChange={(e) => setSource(e.target.value as Source)} aria-label="Kelime kaynağı">
            <option value="all">Tüm kelimeler</option>
            <optgroup label="Paketler">
              {(Object.keys(PACKS) as PackId[]).map((id) => (
                <option key={id} value={id}>
                  {PACKS[id].name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Seviyeler">
              {LEVEL_ORDER.map((l) => (
                <option key={l} value={l}>
                  {l} · {LEVELS[l].name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Konular">
              {(Object.keys(TOPICS) as TopicId[]).map((id) => (
                <option key={id} value={`topic:${id}`}>
                  {TOPICS[id].emoji} {TOPICS[id].name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      </FilterChips>
      <p className="muted small list-count-line">{list.length} kelime</p>
      {list.length === 0 && (
        <p className="card muted center">
          {q
            ? 'Aramana uyan kelime yok.'
            : filter === 'learned'
              ? 'Burada henüz öğrendiğin kelime yok. Çalıştıkça öğrendiğin kelimeler burada birikecek.'
              : 'Bu filtrede kelime yok.'}
        </p>
      )}
      {list.length > 0 && (
        <ul className="card word-rows">
          {list.map((w, i) => (
            <li key={w.id} className="word-row" id={`row-${w.id}`}>
              <button className="word-row-main" onClick={() => setViewing(i)}>
                <WordRowContent word={w} card={progress.cards[w.id]} />
              </button>
              <SpeakButton text={w.en} icon="🔈" />
            </li>
          ))}
        </ul>
      )}
      {viewing !== null && list[viewing] && (
        <WordViewer
          words={list}
          index={viewing}
          progress={progress}
          now={now}
          onIndexChange={setViewing}
          onClose={() => {
            const id = list[viewing].id;
            setViewing(null);
            requestAnimationFrame(() => document.getElementById(`row-${id}`)?.scrollIntoView({ block: 'center' }));
          }}
        />
      )}
    </div>
  );
}
