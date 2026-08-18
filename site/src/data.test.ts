import { describe, expect, it } from 'vitest';

import psnConfig from '../../psn.config.json';
import { snapshotByKey, snapshotsByKey, suggestionsData } from './data';

/**
 * Snapshots load via an `import.meta.glob` over every data/<player>/latest.json
 * rather than per-player imports, so these cases are driven off psn.config.json:
 * a player configured without a committed snapshot (or with a mismatched
 * directory name) fails here rather than silently rendering an empty page.
 */
const configuredKeys = psnConfig.players.map((player) => player.key);

describe('snapshotByKey', () => {
  it.each(configuredKeys)('loads a PlayerSnapshot for configured player "%s"', (key) => {
    expect(snapshotByKey(key)?.player.key).toBe(key);
  });

  it('returns undefined for an unconfigured key', () => {
    expect(snapshotByKey('stranger')).toBeUndefined();
  });
});

describe('snapshotsByKey', () => {
  it.each(configuredKeys)('returns an ordered, non-empty history for "%s"', (key) => {
    // Players with no dated files yet fall back to [latest.json].
    const history = snapshotsByKey(key);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0]?.player.key).toBe(key);
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
