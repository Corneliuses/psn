import { describe, expect, it } from 'vitest';

import { snapshotByKey, snapshotsByKey, suggestionsData } from './data';

describe('snapshotByKey', () => {
  it('loads a PlayerSnapshot for each configured player via Vite JSON import', () => {
    expect(snapshotByKey('dad')?.player.key).toBe('dad');
    expect(snapshotByKey('braidan')?.player.key).toBe('braidan');
  });

  it('returns undefined for an unconfigured key', () => {
    expect(snapshotByKey('stranger')).toBeUndefined();
  });
});

describe('snapshotsByKey', () => {
  it('returns an ordered, non-empty history for a configured player', () => {
    // Until dated files land (#8), this falls back to [latest.json].
    const history = snapshotsByKey('dad');
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0]?.player.key).toBe('dad');
    const times = history.map((s) => s.capturedAt);
    expect([...times].sort()).toEqual(times); // oldest → newest
  });

  it('returns an empty array for an unconfigured key', () => {
    expect(snapshotsByKey('stranger')).toEqual([]);
  });
});

describe('suggestionsData', () => {
  it('loads the committed data/suggestions.json via Vite JSON import', () => {
    const data = suggestionsData();
    expect(data.metadata.rawg_base_url).toBe('https://rawg.io');
    expect(Array.isArray(data.shared_genres)).toBe(true);
  });
});
