/**
 * Research-spike prototype for #9 — NOT product code.
 *
 * Reads the real committed snapshots, builds a playtime-weighted genre profile
 * per player, and asks RAWG and/or IGDB for well-rated PS4/PS5 games in the top
 * shared genres that neither player owns. Reports per-API title match rates —
 * the key evidence for the recommendation in docs/game-suggestions-spike.md.
 *
 *   pnpm tsx scripts/spike-suggestions.ts                # both APIs
 *   pnpm tsx scripts/spike-suggestions.ts --api rawg     # one API only
 *   pnpm tsx scripts/spike-suggestions.ts --max-titles 20 --json out.json
 *
 * Env (in .env, gitignored — see docs/game-suggestions-spike.md):
 *   RAWG_API_KEY                RAWG key from rawg.io/apidocs
 *   IGDB_TWITCH_CLIENT_ID       Twitch dev app (dev.twitch.tv)
 *   IGDB_TWITCH_CLIENT_SECRET
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { loadConfig } from '../src/cli/config.js';
import type { PlayedTitle, PlayerSnapshot } from '../src/psn/models.js';
import { nameKey } from '../src/stats/names.js';

const GAME_CATEGORIES = new Set(['ps4_game', 'ps5_native_game', 'ps4_ps2emu_game']);
const RAWG_PLATFORMS = '18,187'; // PS4, PS5
const IGDB_PLATFORMS = '(48,167)'; // PS4, PS5

// ---------- shared helpers ----------

function loadDotEnvIfPresent(): void {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file — env vars may still be set directly.
  }
}

function requireEnv(envVar: string): string {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`Missing ${envVar}. Add it to .env (see docs/game-suggestions-spike.md).`);
  }
  return value;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * PSN decorates names beyond what nameKey() strips: "(PlayStation®5)" suffixes,
 * "PS4 & PS5" bundles, edition tags. Reduce to a catalog-searchable base name.
 */
function cleanTitleName(name: string): string {
  return name
    .replace(/[®™©]/g, '')
    .replace(/\((?:[^)]*playstation[^)]*|ps[45][^)]*)\)/gi, ' ')
    .replace(/\bps4\s*&\s*ps5\b/gi, ' ')
    .replace(/\b(?:ps[45]|playstation\s*[45]?)\s*(?:edition|version)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface OwnedGame {
  key: string;
  searchName: string;
  displayName: string;
  minutes: number;
  players: string[];
}

/** Filter to real games, clean names, dedupe PS4/PS5 variants, merge across players. */
function collectLibrary(snapshots: Map<string, PlayerSnapshot>): OwnedGame[] {
  const byKey = new Map<string, OwnedGame>();
  for (const [playerKey, snapshot] of snapshots) {
    const perPlayer = new Map<string, PlayedTitle[]>();
    for (const title of snapshot.playedTitles) {
      if (!GAME_CATEGORIES.has(title.category)) continue;
      const key = nameKey(cleanTitleName(title.name));
      if (!key) continue;
      const list = perPlayer.get(key) ?? [];
      list.push(title);
      perPlayer.set(key, list);
    }
    for (const [key, titles] of perPlayer) {
      const minutes = titles.reduce((sum, t) => sum + t.playDurationMinutes, 0);
      const existing = byKey.get(key);
      if (existing) {
        existing.minutes += minutes;
        existing.players.push(playerKey);
      } else {
        const first = titles[0];
        if (!first) continue;
        byKey.set(key, {
          key,
          searchName: cleanTitleName(first.name),
          displayName: first.name,
          minutes,
          players: [playerKey],
        });
      }
    }
  }
  return [...byKey.values()].sort((a, b) => b.minutes - a.minutes);
}

interface MatchResult {
  ownedKey: string;
  matchedName: string | null;
  genres: string[];
}

interface Suggestion {
  name: string;
  rating: number | null;
  released: string | null;
}

interface ApiReport {
  api: 'rawg' | 'igdb';
  matched: number;
  attempted: number;
  unmatched: string[];
  genreMinutes: Record<string, Record<string, number>>; // playerKey → genre → minutes
  suggestionsByGenre: Record<string, Suggestion[]>;
}

// ---------- RAWG ----------

async function rawgFetch(path: string, key: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`https://api.rawg.io/api/${path}`);
  url.searchParams.set('key', key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG ${path} failed: HTTP ${res.status}`);
  return res.json();
}

interface RawgGame {
  name: string;
  slug: string;
  released: string | null;
  metacritic: number | null;
  genres?: { name: string; slug: string }[];
}

async function rawgMatch(library: OwnedGame[], key: string): Promise<Map<string, MatchResult>> {
  const results = new Map<string, MatchResult>();
  for (const game of library) {
    const data = (await rawgFetch('games', key, {
      search: game.searchName,
      platforms: RAWG_PLATFORMS,
      page_size: '5',
    })) as { results?: RawgGame[] };
    const candidates = data.results ?? [];
    const exact = candidates.find((c) => nameKey(c.name) === game.key);
    const best = exact ?? candidates[0];
    results.set(game.key, {
      ownedKey: game.key,
      matchedName: best?.name ?? null,
      genres: best?.genres?.map((g) => g.name) ?? [],
    });
    await sleep(120);
  }
  return results;
}

async function rawgSuggest(
  genreSlugs: Map<string, string>,
  topGenres: string[],
  ownedKeys: Set<string>,
  key: string,
  perGenre: number,
): Promise<Record<string, Suggestion[]>> {
  const out: Record<string, Suggestion[]> = {};
  for (const genre of topGenres) {
    const slug = genreSlugs.get(genre);
    if (!slug) continue;
    const data = (await rawgFetch('games', key, {
      genres: slug,
      platforms: RAWG_PLATFORMS,
      ordering: '-metacritic',
      page_size: '40',
    })) as { results?: RawgGame[] };
    out[genre] = (data.results ?? [])
      .filter((g) => !ownedKeys.has(nameKey(g.name)))
      .slice(0, perGenre)
      .map((g) => ({ name: g.name, rating: g.metacritic, released: g.released }));
    await sleep(120);
  }
  return out;
}

// ---------- IGDB ----------

async function igdbToken(clientId: string, clientSecret: string): Promise<string> {
  const url = new URL('https://id.twitch.tv/oauth2/token');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_secret', clientSecret);
  url.searchParams.set('grant_type', 'client_credentials');
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`Twitch token exchange failed: HTTP ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

interface IgdbGame {
  name: string;
  total_rating?: number;
  first_release_date?: number;
  genres?: { name: string }[];
}

async function igdbQuery(endpoint: string, body: string, clientId: string, token: string): Promise<unknown> {
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: { 'Client-ID': clientId, Authorization: `Bearer ${token}` },
    body,
  });
  if (!res.ok) throw new Error(`IGDB ${endpoint} failed: HTTP ${res.status}`);
  return res.json();
}

async function igdbMatch(
  library: OwnedGame[],
  clientId: string,
  token: string,
): Promise<Map<string, MatchResult>> {
  const results = new Map<string, MatchResult>();
  for (const game of library) {
    const escaped = game.searchName.replace(/([\\"])/g, '\\$1');
    const body = `search "${escaped}"; fields name,genres.name; where platforms = ${IGDB_PLATFORMS}; limit 5;`;
    const candidates = (await igdbQuery('games', body, clientId, token)) as IgdbGame[];
    const exact = candidates.find((c) => nameKey(c.name) === game.key);
    const best = exact ?? candidates[0];
    results.set(game.key, {
      ownedKey: game.key,
      matchedName: best?.name ?? null,
      genres: best?.genres?.map((g) => g.name) ?? [],
    });
    await sleep(260); // 4 req/s limit
  }
  return results;
}

async function igdbSuggest(
  topGenres: string[],
  ownedKeys: Set<string>,
  clientId: string,
  token: string,
  perGenre: number,
): Promise<Record<string, Suggestion[]>> {
  const allGenres = (await igdbQuery('genres', 'fields name; limit 50;', clientId, token)) as {
    id: number;
    name: string;
  }[];
  await sleep(260);
  const out: Record<string, Suggestion[]> = {};
  for (const genre of topGenres) {
    const meta = allGenres.find((g) => g.name === genre);
    if (!meta) continue;
    const body =
      `fields name,total_rating,first_release_date; ` +
      `where genres = (${meta.id}) & platforms = ${IGDB_PLATFORMS} & total_rating_count > 50; ` +
      `sort total_rating desc; limit 40;`;
    const games = (await igdbQuery('games', body, clientId, token)) as IgdbGame[];
    out[genre] = games
      .filter((g) => !ownedKeys.has(nameKey(g.name)))
      .slice(0, perGenre)
      .map((g) => ({
        name: g.name,
        rating: g.total_rating != null ? Math.round(g.total_rating) : null,
        released: g.first_release_date
          ? new Date(g.first_release_date * 1000).toISOString().slice(0, 10)
          : null,
      }));
  }
  return out;
}

// ---------- profile + report ----------

function buildReport(
  api: 'rawg' | 'igdb',
  library: OwnedGame[],
  matches: Map<string, MatchResult>,
): Omit<ApiReport, 'suggestionsByGenre'> {
  const genreMinutes: Record<string, Record<string, number>> = {};
  const unmatched: string[] = [];
  let matched = 0;
  for (const game of library) {
    const match = matches.get(game.key);
    if (!match?.matchedName) {
      unmatched.push(game.displayName);
      continue;
    }
    matched++;
    for (const player of game.players) {
      const bucket = (genreMinutes[player] ??= {});
      for (const genre of match.genres) {
        bucket[genre] = (bucket[genre] ?? 0) + game.minutes;
      }
    }
  }
  return { api, matched, attempted: library.length, unmatched, genreMinutes };
}

/** Genres both players have time in, ranked by combined minutes. */
function topSharedGenres(genreMinutes: Record<string, Record<string, number>>, count: number): string[] {
  const players = Object.keys(genreMinutes);
  const first = players[0];
  if (!first) return [];
  const shared = Object.keys(genreMinutes[first] ?? {}).filter((genre) =>
    players.every((p) => (genreMinutes[p]?.[genre] ?? 0) > 0),
  );
  return shared
    .sort((a, b) => {
      const total = (g: string) => players.reduce((sum, p) => sum + (genreMinutes[p]?.[g] ?? 0), 0);
      return total(b) - total(a);
    })
    .slice(0, count);
}

function printReport(report: ApiReport, playerNames: Map<string, string>): void {
  const pct = ((100 * report.matched) / Math.max(1, report.attempted)).toFixed(1);
  console.log(`\n=== ${report.api.toUpperCase()} ===`);
  console.log(`Match rate: ${report.matched}/${report.attempted} (${pct}%)`);
  if (report.unmatched.length > 0) {
    console.log(`Unmatched (${report.unmatched.length}): ${report.unmatched.slice(0, 15).join('; ')}${report.unmatched.length > 15 ? ' …' : ''}`);
  }
  for (const [playerKey, genres] of Object.entries(report.genreMinutes)) {
    const top = Object.entries(genres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([g, m]) => `${g} (${Math.round(m / 60)}h)`)
      .join(', ');
    console.log(`${playerNames.get(playerKey) ?? playerKey} top genres: ${top}`);
  }
  for (const [genre, suggestions] of Object.entries(report.suggestionsByGenre)) {
    console.log(`\nSuggestions — ${genre}:`);
    for (const s of suggestions) {
      console.log(`  ${s.name}${s.rating != null ? ` [${s.rating}]` : ''}${s.released ? ` (${s.released})` : ''}`);
    }
  }
}

// ---------- main ----------

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      api: { type: 'string', default: 'both' },
      'max-titles': { type: 'string' },
      'top-genres': { type: 'string', default: '3' },
      'per-genre': { type: 'string', default: '10' },
      json: { type: 'string' },
    },
  });
  const apis = values.api === 'both' ? (['rawg', 'igdb'] as const) : ([values.api] as ('rawg' | 'igdb')[]);
  const topGenreCount = Number(values['top-genres']);
  const perGenre = Number(values['per-genre']);

  loadDotEnvIfPresent();
  const config = loadConfig('psn.config.json');
  const snapshots = new Map<string, PlayerSnapshot>();
  const playerNames = new Map<string, string>();
  for (const player of config.players) {
    snapshots.set(
      player.key,
      JSON.parse(readFileSync(`data/${player.key}/latest.json`, 'utf8')) as PlayerSnapshot,
    );
    playerNames.set(player.key, player.displayName);
  }

  let library = collectLibrary(snapshots);
  const ownedKeys = new Set(library.map((g) => g.key));
  if (values['max-titles']) library = library.slice(0, Number(values['max-titles']));
  console.log(
    `Library: ${library.length} unique games after filtering/dedupe ` +
      `(from ${[...snapshots.values()].reduce((n, s) => n + s.playedTitles.length, 0)} raw played titles)`,
  );

  const reports: ApiReport[] = [];
  for (const api of apis) {
    if (api === 'rawg') {
      const key = requireEnv('RAWG_API_KEY');
      const matches = await rawgMatch(library, key);
      const base = buildReport('rawg', library, matches);
      const genreSlugs = new Map<string, string>();
      const rawgGenres = (await rawgFetch('genres', key, { page_size: '40' })) as {
        results?: { name: string; slug: string }[];
      };
      for (const g of rawgGenres.results ?? []) genreSlugs.set(g.name, g.slug);
      const top = topSharedGenres(base.genreMinutes, topGenreCount);
      const suggestionsByGenre = await rawgSuggest(genreSlugs, top, ownedKeys, key, perGenre);
      reports.push({ ...base, suggestionsByGenre });
    } else {
      const clientId = requireEnv('IGDB_TWITCH_CLIENT_ID');
      const token = await igdbToken(clientId, requireEnv('IGDB_TWITCH_CLIENT_SECRET'));
      const matches = await igdbMatch(library, clientId, token);
      const base = buildReport('igdb', library, matches);
      const top = topSharedGenres(base.genreMinutes, topGenreCount);
      const suggestionsByGenre = await igdbSuggest(top, ownedKeys, clientId, token, perGenre);
      reports.push({ ...base, suggestionsByGenre });
    }
  }

  for (const report of reports) printReport(report, playerNames);
  if (values.json) {
    writeFileSync(values.json, JSON.stringify({ library, reports }, null, 2) + '\n');
    console.log(`\nRaw dump written to ${values.json}`);
  }
}

await main();
