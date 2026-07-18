import type { PlayerIdentity, PlayerSnapshot } from '../psn/models.js';
import { nameKey } from './names.js';
import { playerTotals, type PlayerTotals } from './totals.js';

export interface MetricComparison {
  metric: string;
  label: string;
  a: number;
  b: number;
  winner: 'a' | 'b' | 'tie';
}

export interface SharedGame {
  name: string;
  a: { playtimeMinutes: number; trophiesEarned: number };
  b: { playtimeMinutes: number; trophiesEarned: number };
}

export interface Comparison {
  players: { a: PlayerIdentity; b: PlayerIdentity };
  totals: { a: PlayerTotals; b: PlayerTotals };
  metrics: MetricComparison[];
  sharedGames: SharedGame[];
}

function metric(metricKey: string, label: string, a: number, b: number): MetricComparison {
  return { metric: metricKey, label, a, b, winner: a > b ? 'a' : b > a ? 'b' : 'tie' };
}

/**
 * Head-to-head comparison across all tracked stats, in a shape a UI can
 * render directly: per-metric winners plus a shared-games breakdown.
 */
export function comparePlayers(a: PlayerSnapshot, b: PlayerSnapshot): Comparison {
  const totalsA = playerTotals(a);
  const totalsB = playerTotals(b);

  const trophiesByNameB = new Map(b.trophyTitles.map((t) => [nameKey(t.name), t]));
  const playedByNameB = new Map(b.playedTitles.map((t) => [nameKey(t.name), t]));

  const sharedGames: SharedGame[] = a.playedTitles
    .filter((t) => playedByNameB.has(nameKey(t.name)))
    .map((t) => {
      const other = playedByNameB.get(nameKey(t.name));
      const trophiesA = a.trophyTitles.find((x) => nameKey(x.name) === nameKey(t.name));
      const trophiesB = trophiesByNameB.get(nameKey(t.name));
      return {
        name: t.name,
        a: { playtimeMinutes: t.playDurationMinutes, trophiesEarned: trophiesA?.earnedTotal ?? 0 },
        b: {
          playtimeMinutes: other?.playDurationMinutes ?? 0,
          trophiesEarned: trophiesB?.earnedTotal ?? 0,
        },
      };
    })
    .sort((x, y) => y.a.playtimeMinutes + y.b.playtimeMinutes - (x.a.playtimeMinutes + x.b.playtimeMinutes));

  return {
    players: { a: a.player, b: b.player },
    totals: { a: totalsA, b: totalsB },
    metrics: [
      metric('playtimeMinutes', 'Total play time (minutes)', totalsA.playtimeMinutes, totalsB.playtimeMinutes),
      metric('gamesPlayed', 'Games played', totalsA.gamesPlayed, totalsB.gamesPlayed),
      metric('trophiesTotal', 'Total trophies', totalsA.trophiesTotal, totalsB.trophiesTotal),
      metric('bronze', 'Bronze trophies', totalsA.trophies.bronze, totalsB.trophies.bronze),
      metric('silver', 'Silver trophies', totalsA.trophies.silver, totalsB.trophies.silver),
      metric('gold', 'Gold trophies', totalsA.trophies.gold, totalsB.trophies.gold),
      metric('platinums', 'Platinum trophies', totalsA.platinums, totalsB.platinums),
      metric('sharedGames', 'Shared games', sharedGames.length, sharedGames.length),
    ],
    sharedGames,
  };
}

/** Which player leads a metric, or a tie. */
export type SharedGameLeader = 'a' | 'b' | 'tie';

export interface SharedGameSide {
  playtimeMinutes: number;
  trophiesEarned: number;
  /** ISO 8601 datetime this player last played the game. */
  lastPlayed: string;
}

/** One shared game with head-to-head gaps and a recency winner. */
export interface SharedGameDeepDive {
  name: string;
  a: SharedGameSide;
  b: SharedGameSide;
  /** Absolute playtime difference in minutes. */
  playtimeGap: number;
  /** Absolute trophies-earned difference. */
  trophyGap: number;
  playtimeLeader: SharedGameLeader;
  trophyLeader: SharedGameLeader;
  recentlyPlayedBy: SharedGameLeader;
}

function leader(a: number, b: number): SharedGameLeader {
  return a > b ? 'a' : b > a ? 'b' : 'tie';
}

/**
 * Expand the shared-games comparison into a deep dive: for every title both
 * players have played, the per-player playtime/trophies/last-played plus the
 * playtime gap, trophy gap, and who played it more recently. Sorted by combined
 * playtime (busiest shared game first), like `comparePlayers().sharedGames`.
 * Additive to `comparePlayers` — that function's shape is unchanged.
 */
export function sharedGamesDeepDive(a: PlayerSnapshot, b: PlayerSnapshot): SharedGameDeepDive[] {
  const playedByNameB = new Map(b.playedTitles.map((t) => [nameKey(t.name), t]));
  const trophiesByNameA = new Map(a.trophyTitles.map((t) => [nameKey(t.name), t]));
  const trophiesByNameB = new Map(b.trophyTitles.map((t) => [nameKey(t.name), t]));

  return a.playedTitles
    .filter((t) => playedByNameB.has(nameKey(t.name)))
    .map((t) => {
      const key = nameKey(t.name);
      const other = playedByNameB.get(key)!;
      const sideA: SharedGameSide = {
        playtimeMinutes: t.playDurationMinutes,
        trophiesEarned: trophiesByNameA.get(key)?.earnedTotal ?? 0,
        lastPlayed: t.lastPlayed,
      };
      const sideB: SharedGameSide = {
        playtimeMinutes: other.playDurationMinutes,
        trophiesEarned: trophiesByNameB.get(key)?.earnedTotal ?? 0,
        lastPlayed: other.lastPlayed,
      };
      return {
        name: t.name,
        a: sideA,
        b: sideB,
        playtimeGap: Math.abs(sideA.playtimeMinutes - sideB.playtimeMinutes),
        trophyGap: Math.abs(sideA.trophiesEarned - sideB.trophiesEarned),
        playtimeLeader: leader(sideA.playtimeMinutes, sideB.playtimeMinutes),
        trophyLeader: leader(sideA.trophiesEarned, sideB.trophiesEarned),
        recentlyPlayedBy: leader(Date.parse(sideA.lastPlayed), Date.parse(sideB.lastPlayed)),
      };
    })
    .sort(
      (x, y) =>
        y.a.playtimeMinutes + y.b.playtimeMinutes - (x.a.playtimeMinutes + x.b.playtimeMinutes),
    );
}
