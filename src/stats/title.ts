import type { PlayerSnapshot } from '../psn/models.js';
import { nameKey } from './names.js';

/**
 * One player's standing on a single game, rolled up across every snapshot entry
 * that matches it. A title can appear more than once in a library — separate
 * SKUs/regions share a name but not a titleId, and a cross-gen game can carry
 * both a PS4 and a PS5 trophy stack — so playtime, play counts and trophies are
 * summed over all matches rather than taken from the first one found.
 */
export interface TitleStats {
  /** The title name as it appears in this player's snapshot. */
  name: string;
  playtimeMinutes: number;
  playCount: number;
  trophiesEarned: number;
  trophiesDefined: number;
  /** Highest completion percentage across the matched trophy stacks (0–100). */
  progress: number;
  hasPlatinum: boolean;
  /** ISO 8601 datetime of the earliest session across matches, if any. */
  firstPlayed?: string;
  /** ISO 8601 datetime of the latest session across matches, if any. */
  lastPlayed?: string;
}

/**
 * Roll a player's snapshot up into their standing on one game.
 *
 * `names` is the list of names the game goes by — PSN spells the same game
 * differently across stores and trophy lists (e.g. "Grounded PS4® & PS5®" as a
 * played title, "Grounded" as a trophy list), so a caller passes every alias and
 * they are matched with `nameKey` (case- and trademark-insensitive).
 *
 * Returns `undefined` when the player has neither played the game nor earned a
 * trophy in it, so a caller can distinguish "not in this library" from "owned
 * but untouched" (which returns zeroed stats).
 */
export function titleStats(snapshot: PlayerSnapshot, names: string[]): TitleStats | undefined {
  const keys = new Set(names.map(nameKey));
  const played = snapshot.playedTitles.filter((t) => keys.has(nameKey(t.name)));
  const trophies = snapshot.trophyTitles.filter((t) => keys.has(nameKey(t.name)));
  if (played.length === 0 && trophies.length === 0) return undefined;

  // Session dates are spread in only when the game has actually been played, so
  // the optional fields stay absent rather than explicitly undefined
  // (exactOptionalPropertyTypes).
  const sessions = played.flatMap((t) => [t.firstPlayed, t.lastPlayed]).filter(Boolean);
  const span =
    sessions.length > 0
      ? {
          firstPlayed: sessions.reduce((min, d) => (d < min ? d : min)),
          lastPlayed: sessions.reduce((max, d) => (d > max ? d : max)),
        }
      : {};

  return {
    name: played[0]?.name ?? trophies[0]!.name,
    playtimeMinutes: played.reduce((sum, t) => sum + t.playDurationMinutes, 0),
    playCount: played.reduce((sum, t) => sum + t.playCount, 0),
    trophiesEarned: trophies.reduce((sum, t) => sum + t.earnedTotal, 0),
    trophiesDefined: trophies.reduce(
      (sum, t) => sum + t.defined.bronze + t.defined.silver + t.defined.gold + t.defined.platinum,
      0,
    ),
    progress: trophies.reduce((max, t) => Math.max(max, t.progress), 0),
    hasPlatinum: trophies.some((t) => t.hasPlatinum),
    ...span,
  };
}
