import type { PlayerSnapshot, TrophyCounts } from '../psn/models.js';
import { totalTrophies } from '../psn/models.js';

/** Aggregate per-player totals derived from a single snapshot. */
export interface PlayerTotals {
  playtimeMinutes: number;
  gamesPlayed: number;
  trophies: TrophyCounts;
  trophiesTotal: number;
  platinums: number;
}

/** Roll a snapshot up into the headline totals a UI can render directly. */
export function playerTotals(snapshot: PlayerSnapshot): PlayerTotals {
  const trophies = snapshot.trophyTitles.reduce<TrophyCounts>(
    (acc, t) => ({
      bronze: acc.bronze + t.earned.bronze,
      silver: acc.silver + t.earned.silver,
      gold: acc.gold + t.earned.gold,
      platinum: acc.platinum + t.earned.platinum,
    }),
    { bronze: 0, silver: 0, gold: 0, platinum: 0 },
  );
  return {
    playtimeMinutes: snapshot.playedTitles.reduce((sum, t) => sum + t.playDurationMinutes, 0),
    gamesPlayed: snapshot.playedTitles.length,
    trophies,
    trophiesTotal: totalTrophies(trophies),
    platinums: trophies.platinum,
  };
}
