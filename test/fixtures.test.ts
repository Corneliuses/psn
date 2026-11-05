import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/cli/config.js';
import { sampleSnapshot } from '../src/fixtures/sample.js';

/**
 * `pnpm sync --dry-run` builds a snapshot via sampleSnapshot() for every
 * configured player, so a player added to psn.config.json without a matching
 * entry in src/fixtures/sample.ts breaks the dry run (and any fixture-backed
 * placeholder snapshot). Driving these cases off the real config keeps the two
 * files from drifting as the roster grows.
 */
const configuredPlayers = loadConfig('psn.config.json').players.map(
  ({ key, displayName }) => [key, displayName] as const,
);

describe('sample fixtures', () => {
  it.each(configuredPlayers)('builds a snapshot for configured player "%s"', (key, displayName) => {
    const snapshot = sampleSnapshot(key, displayName);

    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.player).toEqual({ key, displayName });
    expect(snapshot.playedTitles.length).toBeGreaterThan(0);
    expect(snapshot.trophyTitles.length).toBeGreaterThan(0);
  });

  it.each(configuredPlayers)('sorts "%s" fixture arrays by their stable IDs', (key, displayName) => {
    // Snapshots are diff-friendly: arrays sorted by stable IDs (AGENTS.md).
    const snapshot = sampleSnapshot(key, displayName);

    const titleIds = snapshot.playedTitles.map((title) => title.titleId);
    expect(titleIds).toEqual([...titleIds].sort());

    const trophyIds = snapshot.trophyTitles.map((title) => title.npCommunicationId);
    expect(trophyIds).toEqual([...trophyIds].sort());
  });

  it('throws a helpful error for a player with no fixture data', () => {
    expect(() => sampleSnapshot('stranger', 'Stranger')).toThrow(
      /No sample data for player "stranger"/,
    );
  });
});
