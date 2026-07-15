import type { PlayerSnapshot, TrophyTitleStats } from '../psn/models.js';

/** Games ranked by earned trophy count, most first. Ties break by progress. */
export function gamesWithMostTrophies(snapshot: PlayerSnapshot, limit = 10): TrophyTitleStats[] {
  return [...snapshot.trophyTitles]
    .sort((a, b) => b.earnedTotal - a.earnedTotal || b.progress - a.progress)
    .slice(0, limit);
}

/** Every game with an earned platinum, most recent trophy first. */
export function platinumGames(snapshot: PlayerSnapshot): TrophyTitleStats[] {
  return snapshot.trophyTitles
    .filter((t) => t.hasPlatinum)
    .sort((a, b) => Date.parse(b.lastTrophyAt) - Date.parse(a.lastTrophyAt));
}
