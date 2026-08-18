import type { PlayerSnapshot } from 'psn';
import type { SuggestionsFile } from 'psn/suggestions';

import suggestions from '../../data/suggestions.json';

// Build-time current-snapshot loading. Every data/<player>/latest.json is
// eagerly imported and keyed by its directory name, so adding a player to
// psn.config.json (and committing their snapshot) needs no change here. The
// glob is one directory deeper than data/suggestions.json and
// data/suggestions-cache.json, so those are never matched.
//
// FIXTURE DATA: data/nadia/latest.json is still a placeholder snapshot (see
// sampleSnapshot() in the root package), not real synced PSN data — it exists
// so her page renders before her first sync, and the daily sync workflow
// overwrites it once the NPSSO_NADIA secret is set. data/dad and data/braidan
// hold genuine synced data.
const LATEST_FILE_RE = /\/data\/([^/]+)\/latest\.json$/;

const latestModules = import.meta.glob<{ default: PlayerSnapshot }>('../../data/*/latest.json', {
  eager: true,
});

const snapshots: Partial<Record<string, PlayerSnapshot>> = {};
for (const [path, module] of Object.entries(latestModules)) {
  const key = LATEST_FILE_RE.exec(path)?.[1];
  if (key) snapshots[key] = module.default;
}

export function snapshotByKey(key: string): PlayerSnapshot | undefined {
  return snapshots[key];
}

/**
 * Game suggestions built at sync time (see src/suggestions/) from the top
 * genres both players share. `by_genre` is empty until a real RAWG-backed
 * sync has run.
 */
export function suggestionsData(): SuggestionsFile {
  return suggestions as SuggestionsFile;
}

// Build-time snapshot history. The static site can't read the filesystem at
// runtime the way `readAllSnapshots` does, so every dated snapshot file is
// eagerly imported at build time and grouped by player key. `latest.json` is
// excluded here (it mirrors the newest dated file); it only serves as the
// fallback in `snapshotsByKey` below.
const DATED_FILE_RE = /\/data\/([^/]+)\/(\d{4}-\d{2}-\d{2})\.json$/;

const datedModules = import.meta.glob<{ default: PlayerSnapshot }>('../../data/*/*.json', {
  eager: true,
});

const history: Partial<Record<string, PlayerSnapshot[]>> = {};
for (const [path, module] of Object.entries(datedModules)) {
  const match = DATED_FILE_RE.exec(path);
  if (!match) continue; // skips latest.json and any non-dated file
  const key = match[1]!;
  (history[key] ??= []).push(module.default);
}
for (const snapshotsForKey of Object.values(history)) {
  snapshotsForKey!.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}

/**
 * Full snapshot history for a player, oldest → newest, for the trend analytics.
 * Falls back to `[latest.json]` when no dated snapshots are committed yet — the
 * current state until auto-sync (#8) accumulates history, so trends render a
 * single point rather than nothing. An unconfigured key yields an empty array.
 */
export function snapshotsByKey(key: string): PlayerSnapshot[] {
  const dated = history[key];
  if (dated && dated.length > 0) return dated;
  const latest = snapshots[key];
  return latest ? [latest] : [];
}
