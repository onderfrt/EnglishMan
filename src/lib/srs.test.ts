import { describe, expect, it } from 'vitest';
import { DAY, formatDue, newCard, review } from './srs';

const T0 = Date.UTC(2026, 0, 1);

describe('review', () => {
  it('grows the interval on consecutive correct answers', () => {
    let c = newCard('w', T0);
    const intervals: number[] = [];
    for (let i = 0; i < 5; i++) {
      c = review(c, 'good', c.due);
      intervals.push(c.interval);
    }
    expect(intervals).toEqual([1, 3, 8, 20, 50]);
    expect(c.due).toBe(c.lastReviewed + 50 * DAY);
  });

  it('resets and schedules a short relearn on a lapse', () => {
    let c = review(review(newCard('w', T0), 'good', T0), 'good', T0 + DAY);
    c = review(c, 'again', T0 + 4 * DAY);
    expect(c.reps).toBe(0);
    expect(c.lapses).toBe(1);
    expect(c.interval).toBe(0);
    expect(c.ease).toBeCloseTo(2.3);
    expect(c.due - c.lastReviewed).toBe(10 * 60 * 1000);
  });

  it('never drops ease below 1.3', () => {
    let c = newCard('w', T0);
    for (let i = 0; i < 20; i++) c = review(c, 'again', T0);
    expect(c.ease).toBe(1.3);
  });
});

describe('formatDue', () => {
  it('shows minutes, hours and days', () => {
    expect(formatDue(T0 + 10 * 60 * 1000, T0)).toBe('10 dk sonra');
    expect(formatDue(T0 + 5 * 3600 * 1000, T0)).toBe('5 saat sonra');
    expect(formatDue(T0 + DAY, T0)).toBe('yarın');
    expect(formatDue(T0 + 8 * DAY, T0)).toBe('8 gün sonra');
    expect(formatDue(T0 - 1, T0)).toBe('şimdi');
  });
});
