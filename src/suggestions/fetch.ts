/**
 * RAWG API client: matches owned titles to genres and fetches highly-rated
 * unowned games per genre. Ported from the #9 research spike
 * (scripts/spike-suggestions.ts), RAWG path only — see docs/game-suggestions-spike.md
 * for why RAWG was chosen over IGDB.
 */
import { nameKey } from '../stats/names.js';
import type { Suggestion } from './types.js';
import type { OwnedGame } from './stats.js';

const RAWG_PLATFORMS = '18,187'; // PS4, PS5

export interface RawgDeps {
  /** Injectable for tests — defaults are never assumed; callers pass the global `fetch`. */
  fetch: typeof fetch;
  apiKey: string;
  /** Delay between requests, ms. Defaults to 120 (RAWG's documented safe spacing). */
  delayMs?: number;
}

interface RawgGame {
  id: number;
  name: string;
  slug: string;
  released: string | null;
  metacritic: number | null;
  genres?: { name: string; slug: string }[];
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function rawgFetch(deps: RawgDeps, path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`https://api.rawg.io/api/${path}`);
  url.searchParams.set('key', deps.apiKey);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await deps.fetch(url);
  if (!res.ok) throw new Error(`RAWG ${path} failed: HTTP ${res.status}`);
  return res.json();
}

export interface MatchResult {
  rawgId: number | null;
  matchedName: string | null;
  genres: string[];
}

/** Resolve each owned title to its RAWG match (id + genres), PS4/PS5 only. */
export async function matchOwnedTitles(
  games: OwnedGame[],
  deps: RawgDeps,
): Promise<Map<string, MatchResult>> {
  const delayMs = deps.delayMs ?? 120;
  const results = new Map<string, MatchResult>();
  for (const game of games) {
    const data = (await rawgFetch(deps, 'games', {
      search: game.searchName,
      platforms: RAWG_PLATFORMS,
      page_size: '5',
    })) as { results?: RawgGame[] };
    const candidates = data.results ?? [];
    const exact = candidates.find((candidate) => nameKey(candidate.name) === game.key);
    const best = exact ?? candidates[0];
    results.set(game.key, {
      rawgId: best?.id ?? null,
      matchedName: best?.name ?? null,
      genres: best?.genres?.map((genre) => genre.name) ?? [],
    });
    if (delayMs > 0) await sleep(delayMs);
  }
  return results;
}

/** genre display name → RAWG slug, needed to query games by genre. */
export async function fetchGenreSlugs(deps: RawgDeps): Promise<Map<string, string>> {
  const data = (await rawgFetch(deps, 'genres', { page_size: '40' })) as {
    results?: { name: string; slug: string }[];
  };
  const slugs = new Map<string, string>();
  for (const genre of data.results ?? []) slugs.set(genre.name, genre.slug);
  return slugs;
}

/** Highly-rated, unowned PS4/PS5 games for each of the given genres. */
export async function fetchSuggestionsForGenres(
  genres: string[],
  genreSlugs: Map<string, string>,
  ownedKeys: Set<string>,
  deps: RawgDeps,
  perGenre = 10,
): Promise<Record<string, Suggestion[]>> {
  const delayMs = deps.delayMs ?? 120;
  const out: Record<string, Suggestion[]> = {};
  for (const genre of genres) {
    const slug = genreSlugs.get(genre);
    if (!slug) continue;
    const data = (await rawgFetch(deps, 'games', {
      genres: slug,
      platforms: RAWG_PLATFORMS,
      ordering: '-metacritic',
      page_size: '40',
    })) as { results?: RawgGame[] };
    out[genre] = (data.results ?? [])
      .filter((candidate) => !ownedKeys.has(nameKey(candidate.name)))
      .slice(0, perGenre)
      .map((candidate) => ({
        name: candidate.name,
        rawgId: candidate.id,
        rating: candidate.metacritic,
        released: candidate.released,
      }));
    if (delayMs > 0) await sleep(delayMs);
  }
  return out;
}
