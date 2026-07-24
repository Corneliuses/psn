/**
 * Sync-time orchestration: read the latest snapshots, resolve owned-title
 * genres (via the persisted cache, fetching only cache misses), build the
 * shared-genre profile, fetch suggestions, apply curated overrides, and
 * write `data/suggestions.json` atomically.
 */
import { join } from 'node:path';

import { readLatestSnapshot } from '../snapshot/store.js';
import { applyOverrides, loadOverrides } from './overrides.js';
import { loadCache, missingKeys, saveCache } from './cache.js';
import { fetchGenreSlugs, fetchSuggestionsForGenres, matchOwnedTitles, type RawgDeps } from './fetch.js';
import { buildGenreProfile, collectLibrary, sharedGenres, type MatchedGame } from './stats.js';
import { writeSuggestionsAtomic } from './store.js';
import type { SuggestionsFile } from './types.js';

const DEFAULT_BUILD = 'v0.1.0';

export interface SyncSuggestionsOptions {
  /** Base data directory, e.g. "data". */
  dataDir: string;
  players: { key: string; displayName: string }[];
  /** RAWG_API_KEY; when absent the sync is skipped (never a hard failure). */
  apiKey?: string;
  /** `pnpm sync --dry-run` never hits the network; suggestions are skipped too. */
  dryRun?: boolean;
  fetch?: typeof fetch;
  delayMs?: number;
  /** How many top shared genres to fetch suggestions for. */
  topGenreCount?: number;
  /** How many suggestions to keep per genre. */
  perGenre?: number;
  now?: () => Date;
  cachePath?: string;
  overridesPath?: string;
  outputPath?: string;
  build?: string;
  /** Injectable for tests. Defaults to reading data/<player>/latest.json. */
  readSnapshot?: typeof readLatestSnapshot;
}

export interface SyncSuggestionsResult {
  skipped: boolean;
  reason?: string;
  matchedGenreCount?: number;
  sharedGenres?: string[];
}

export async function syncSuggestions(options: SyncSuggestionsOptions): Promise<SyncSuggestionsResult> {
  if (options.dryRun) {
    return { skipped: true, reason: 'dry run' };
  }
  if (!options.apiKey) {
    console.warn('Skipping suggestions sync: RAWG_API_KEY not set.');
    return { skipped: true, reason: 'missing RAWG_API_KEY' };
  }

  const now = options.now ?? (() => new Date());
  const readSnapshot = options.readSnapshot ?? readLatestSnapshot;
  const cachePath = options.cachePath ?? join(options.dataDir, 'suggestions-cache.json');
  const overridesPath = options.overridesPath ?? join(options.dataDir, 'suggestions-overrides.json');
  const outputPath = options.outputPath ?? join(options.dataDir, 'suggestions.json');
  const deps: RawgDeps = {
    fetch: options.fetch ?? fetch,
    apiKey: options.apiKey,
    ...(options.delayMs !== undefined ? { delayMs: options.delayMs } : {}),
  };

  const snapshots = new Map(
    options.players.map((player) => [player.key, readSnapshot(options.dataDir, player.key)]),
  );
  const library = collectLibrary(snapshots);
  const ownedKeys = new Set(library.map((game) => game.key));

  const cache = loadCache(cachePath);
  const missing = new Set(missingKeys(library.map((game) => game.key), cache));
  const toFetch = library.filter((game) => missing.has(game.key));
  if (toFetch.length > 0) {
    const matches = await matchOwnedTitles(toFetch, deps);
    const checkedAt = now().toISOString();
    for (const [key, match] of matches) {
      cache[key] = { rawgId: match.rawgId, matchedName: match.matchedName, genres: match.genres, checkedAt };
    }
    saveCache(cachePath, cache);
  }

  const matchedGames: MatchedGame[] = library.map((game) => ({
    ...game,
    genres: cache[game.key]?.genres ?? [],
  }));
  const profile = buildGenreProfile(matchedGames);
  const topShared = sharedGenres(profile, options.topGenreCount ?? 3);

  const genreSlugs = await fetchGenreSlugs(deps);
  const byGenreRaw = await fetchSuggestionsForGenres(
    topShared,
    genreSlugs,
    ownedKeys,
    deps,
    options.perGenre ?? 10,
  );

  const overrides = loadOverrides(overridesPath);
  const byGenre = applyOverrides(byGenreRaw, overrides);

  const file: SuggestionsFile = {
    by_genre: byGenre,
    shared_genres: topShared,
    metadata: {
      generated_at: now().toISOString(),
      rawg_base_url: 'https://rawg.io',
      attribution: 'Data from RAWG.io',
      build: options.build ?? DEFAULT_BUILD,
    },
  };
  writeSuggestionsAtomic(outputPath, file);

  return {
    skipped: false,
    matchedGenreCount: matchedGames.filter((game) => game.genres.length > 0).length,
    sharedGenres: topShared,
  };
}
