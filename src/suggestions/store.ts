/** Atomic write for the committed `data/suggestions.json`. */
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { SuggestionsFile } from './types.js';

/**
 * Write via a temp file + rename so a crash mid-write never leaves a partial
 * `suggestions.json` (the committed data file). Keys/arrays are sorted first
 * for diff-friendly output, matching the snapshot store's convention.
 */
export function writeSuggestionsAtomic(path: string, file: SuggestionsFile): void {
  mkdirSync(dirname(path), { recursive: true });

  const byGenre: SuggestionsFile['by_genre'] = {};
  for (const genre of Object.keys(file.by_genre).sort()) {
    byGenre[genre] = file.by_genre[genre]!;
  }
  const serializable: SuggestionsFile = {
    by_genre: byGenre,
    shared_genres: file.shared_genres,
    metadata: file.metadata,
  };

  const tmpPath = `${path}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(serializable, null, 2) + '\n');
  renameSync(tmpPath, path);
}
