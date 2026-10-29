import { describe, expect, it } from 'vitest';
import type { Word } from '../../data/words';
import { newCard, review } from '../srs';
import { emptyProgress, type Progress } from '../storage';
import { mergeImages, mergeProgress } from './merge';

const T = Date.UTC(2026, 9, 1);
const word = (id: string, tr: string, updatedAt: number): Word => ({
  id, en: id.replace('custom:', ''), tr, pos: 'other', emoji: '📝', example: '', exampleTr: '', topic: 'custom', level: 'B1', custom: true, updatedAt,
});
const device = (patch: Partial<Progress>): Progress => ({ ...emptyProgress(), ...patch });

describe('mergeProgress', () => {
  it('keeps the most recent review of each word from either device', () => {
    const phone = device({ cards: { a: review(newCard('a', T), 'good', T + 1000), b: newCard('b', T) } });
    const laptop = device({ cards: { a: newCard('a', T), c: review(newCard('c', T), 'good', T) } });
    const m = mergeProgress(laptop, phone);
    expect(m.cards.a.reps).toBe(1); // telefondaki çalışma laptoptaki eski kayıtla ezilmedi
    expect(Object.keys(m.cards).sort()).toEqual(['a', 'b', 'c']);
  });

  it('keeps the latest edit of an own word, and deletions win over older edits', () => {
    const phone = device({ customWords: [word('custom:x', 'yeni anlam', T + 5), word('custom:y', 'y', T)] });
    const laptop = device({ customWords: [word('custom:x', 'eski anlam', T), word('custom:y', 'y', T)], deleted: { 'custom:y': T + 10 }, cards: { 'custom:y': newCard('custom:y', T) } });
    const m = mergeProgress(laptop, phone);
    expect(m.customWords.map((w) => [w.id, w.tr])).toEqual([['custom:x', 'yeni anlam']]);
    expect(m.cards['custom:y']).toBeUndefined();
    // Silinen kelime, diğer cihazdan bir sonraki eşitlemede de geri gelmez.
    expect(mergeProgress(phone, m).customWords.map((w) => w.id)).toEqual(['custom:x']);
  });

  it('takes the newest settings and the max of daily stats', () => {
    const a = device({ settingsUpdatedAt: T + 1, days: { '2026-10-01': { reviews: 5, correct: 4, newLearned: 2 } } });
    a.settings = { ...a.settings, goal: 'yds', newPerDay: 15 };
    const b = device({ settingsUpdatedAt: T, days: { '2026-10-01': { reviews: 3, correct: 3, newLearned: 5 } } });
    b.settings = { ...b.settings, goal: 'general' };
    for (const m of [mergeProgress(a, b), mergeProgress(b, a)]) {
      expect(m.settings).toMatchObject({ goal: 'yds', newPerDay: 15 });
      expect(m.days['2026-10-01']).toEqual({ reviews: 5, correct: 4, newLearned: 5 });
    }
  });

  it('lets a fresh device take the account settings even without timestamps', () => {
    const fresh = device({});
    const account = device({});
    account.settings = { ...account.settings, goal: 'yds', newPerDay: 7 };
    expect(mergeProgress(fresh, account).settings).toMatchObject({ goal: 'yds', newPerDay: 7 });
    expect(mergeProgress(account, fresh).settings).toMatchObject({ goal: 'yds', newPerDay: 7 });
  });

  it('is idempotent and order-independent for cards and words', () => {
    const a = device({ cards: { a: newCard('a', T) }, customWords: [word('custom:1', 'bir', T)] });
    const b = device({ cards: { b: newCard('b', T) }, customWords: [word('custom:2', 'iki', T)] });
    const ab = mergeProgress(a, b);
    expect(mergeProgress(ab, b)).toEqual(ab);
    expect(Object.keys(mergeProgress(b, a).cards).sort()).toEqual(Object.keys(ab.cards).sort());
  });

  it('migrates data saved before accounts existed', () => {
    const old = { ...emptyProgress() } as Partial<Progress>;
    delete old.deleted;
    delete old.settingsUpdatedAt;
    expect(() => mergeProgress(old as Progress, device({}))).not.toThrow();
  });
});

describe('notes and favorites', () => {
  it('lets the newest note edit or deletion win, and keeps old untimed notes', () => {
    const phone = device({ notes: { a: 'telefonda yazdım' }, noteAt: { a: T + 10 } });
    const laptop = device({ notes: { a: 'eski', b: 'eski not' }, noteAt: { a: T } });
    expect(mergeProgress(laptop, phone).notes).toEqual({ a: 'telefonda yazdım', b: 'eski not' });
    // Laptopta sonradan silinen not, telefondan geri gelmez.
    const cleared = device({ notes: {}, noteAt: { a: T + 20 } });
    expect(mergeProgress(cleared, phone).notes.a).toBeUndefined();
    expect(mergeProgress(phone, cleared).notes.a).toBeUndefined();
  });

  it('lets the newest favorite toggle win per word', () => {
    const phone = device({ favorites: { a: { on: true, at: T + 5 }, b: { on: false, at: T + 9 } } });
    const laptop = device({ favorites: { a: { on: false, at: T }, b: { on: true, at: T + 1 } } });
    const m = mergeProgress(laptop, phone);
    expect(m.favorites.a.on).toBe(true);
    expect(m.favorites.b.on).toBe(false);
    expect(mergeProgress(phone, laptop).favorites).toEqual(m.favorites);
  });

  it('syncs "learned" marks per word, newest wins, and drops them for deleted words', () => {
    const phone = device({ known: { 'custom:a': { on: true, at: T + 5 }, 'custom:b': { on: true, at: T } } });
    const laptop = device({ known: { 'custom:a': { on: false, at: T + 9 } }, deleted: { 'custom:b': T + 1 } });
    const m = mergeProgress(phone, laptop);
    expect(m.known['custom:a'].on).toBe(false); // laptopta sonradan geri alınmış
    expect(m.known['custom:b']).toBeUndefined();
  });
});

describe('mergeImages', () => {
  it('lets the newest add or removal win per word', () => {
    const local = { images: { a: 'A1', b: 'B1' }, meta: { a: { at: 1 }, b: { at: 5 } } };
    const remote = { images: { a: 'A2' }, meta: { a: { at: 3 }, b: { at: 9, removed: true as const } } };
    const m = mergeImages(local, remote);
    expect(m.images).toEqual({ a: 'A2' });
    expect(m.meta.b).toEqual({ at: 9, removed: true });
  });
});
