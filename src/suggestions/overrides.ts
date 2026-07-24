/** Curated overrides (`data/suggestions-overrides.json`, gitignored, local-only) — see #38 AC6. */
import { existsSync, readFileSync } from 'node:fs';

import type { OverridesFile, Suggestion } from './types.js';

export function loadOverrides(path: string): OverridesFile {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as OverridesFile;
  } catch {
    console.warn(`Malformed suggestions overrides at ${path}; ignoring.`);
    return {};
  }
}

/** Hide entries by RAWG ID or title name, then append any curated additions. */
export function applyOverrides(
  byGenre: Record<string, Suggestion[]>,
  overrides: OverridesFile,
): Record<string, Suggestion[]> {
  const hide = new Set(
    (overrides.hide ?? []).map((entry) => (typeof entry === 'number' ? entry : entry.toLowerCase())),
  );
  const out: Record<string, Suggestion[]> = {};
  for (const [genre, suggestions] of Object.entries(byGenre)) {
    out[genre] = suggestions.filter(
      (suggestion) => !hide.has(suggestion.rawgId) && !hide.has(suggestion.name.toLowerCase()),
    );
  }
  for (const [genre, additions] of Object.entries(overrides.add ?? {})) {
    out[genre] = [...(out[genre] ?? []), ...additions];
  }
  return out;
}
