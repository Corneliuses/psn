/** Persisted title→genre cache (`data/suggestions-cache.json`) — see cache.ts consumers in sync.ts. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import type { GenreCache } from './types.js';

export function loadCache(path: string): GenreCache {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as GenreCache;
  } catch {
    console.warn(`Malformed suggestions cache at ${path}; starting fresh.`);
    return {};
  }
}

/** Stable key order, 2-space indent, trailing newline — matches the repo's diff-friendly convention. */
export function saveCache(path: string, cache: GenreCache): void {
  const sorted: GenreCache = {};
  for (const key of Object.keys(cache).sort()) sorted[key] = cache[key]!;
  writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n');
}

/** Owned-game keys not yet in the cache — the only titles a sync needs to fetch genres for. */
export function missingKeys(gameKeys: string[], cache: GenreCache): string[] {
  return gameKeys.filter((key) => !(key in cache));
}
