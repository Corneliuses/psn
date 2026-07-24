/**
 * Pure genre-profile math over owned libraries — no I/O. Ported from the #9
 * research spike (scripts/spike-suggestions.ts), which validated the
 * name-cleaning and dedupe rules against real synced data.
 */
import type { PlayedTitle, PlayerSnapshot } from '../psn/models.js';
import { nameKey } from '../stats/names.js';

const GAME_CATEGORIES = new Set(['ps4_game', 'ps5_native_game', 'ps4_ps2emu_game']);

/**
 * PSN decorates names beyond what nameKey() strips: "(PlayStation®5)" suffixes,
 * "PS4 & PS5" bundles, edition tags. Reduce to a catalog-searchable base name.
 */
export function cleanTitleName(name: string): string {
  return name
    .replace(/[®™©]/g, '')
    .replace(/\((?:[^)]*playstation[^)]*|ps[45][^)]*)\)/gi, ' ')
    .replace(/\bps4\s*&\s*ps5\b/gi, ' ')
    .replace(/\b(?:ps[45]|playstation\s*[45]?)\s*(?:edition|version)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** One owned game, deduped across players and PS4/PS5 variants. */
export interface OwnedGame {
  /** nameKey() of the cleaned name — the cross-player/cross-platform dedupe key. */
  key: string;
  searchName: string;
  displayName: string;
  minutes: number;
  players: string[];
}

/**
 * Filter every snapshot to real games (excludes media apps, which dominate raw
 * playtime), clean names, and dedupe PS4/PS5 variants — merging playtime and
 * player lists for titles both players own.
 */
export function collectLibrary(snapshots: Map<string, PlayerSnapshot>): OwnedGame[] {
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

/** An owned game with its RAWG genres resolved (via fetch or cache). */
export interface MatchedGame extends OwnedGame {
  genres: string[];
}

/** playerKey → genre → playtime minutes. */
export type GenreMinutes = Record<string, Record<string, number>>;

/** Build a playtime-weighted genre profile: how many minutes each player spent per genre. */
export function buildGenreProfile(games: MatchedGame[]): GenreMinutes {
  const profile: GenreMinutes = {};
  for (const game of games) {
    for (const player of game.players) {
      const bucket = (profile[player] ??= {});
      for (const genre of game.genres) {
        bucket[genre] = (bucket[genre] ?? 0) + game.minutes;
      }
    }
  }
  return profile;
}

/** A player's top genres by playtime, most-played first. */
export function topGenresForPlayer(profile: GenreMinutes, playerKey: string, count = 3): string[] {
  const genres = profile[playerKey] ?? {};
  return Object.entries(genres)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([genre]) => genre);
}

/**
 * Genres every player has time in, ranked by combined minutes, capped to the
 * top `count` — the genres suggestions are fetched for.
 */
export function sharedGenres(profile: GenreMinutes, count = 3): string[] {
  const players = Object.keys(profile);
  const first = players[0];
  if (!first) return [];
  const shared = Object.keys(profile[first] ?? {}).filter((genre) =>
    players.every((player) => (profile[player]?.[genre] ?? 0) > 0),
  );
  const totalMinutes = (genre: string) =>
    players.reduce((sum, player) => sum + (profile[player]?.[genre] ?? 0), 0);
  return shared.sort((a, b) => totalMinutes(b) - totalMinutes(a)).slice(0, count);
}
