import type { PlayerSnapshot, TrophyCounts } from '../psn/models.js';
import { totalTrophies } from '../psn/models.js';
import { playerTotals } from './totals.js';

/** One point on the playtime trend line. */
export interface PlaytimePoint {
  /** ISO 8601 datetime the snapshot was captured — the trend x-axis. */
  capturedAt: string;
  /** Total play time across all titles at that capture, in minutes. */
  playtimeMinutes: number;
}

/**
 * Total playtime per snapshot, oldest → newest, for a simple line-chart shape.
 * The input is assumed ordered (as `readAllSnapshots` returns it). A single
 * snapshot yields one point and an empty history yields none — both normal
 * states until auto-sync accumulates history.
 */
export function playtimeTrend(snapshots: PlayerSnapshot[]): PlaytimePoint[] {
  return snapshots.map((snapshot) => ({
    capturedAt: snapshot.capturedAt,
    playtimeMinutes: playerTotals(snapshot).playtimeMinutes,
  }));
}

/** Trophies earned during the interval between two consecutive snapshots. */
export interface TrophyPaceInterval {
  /** ISO 8601 datetime of the earlier snapshot. */
  from: string;
  /** ISO 8601 datetime of the later snapshot. */
  to: string;
  /** Trophies earned in the interval, by tier. */
  earned: TrophyCounts;
  /** Sum of the earned tiers. */
  total: number;
}

function tierDelta(later: TrophyCounts, earlier: TrophyCounts): TrophyCounts {
  // Trophies are cumulative, so deltas are normally non-negative; clamp at 0 to
  // stay robust against a title dropping out of a later snapshot.
  return {
    bronze: Math.max(0, later.bronze - earlier.bronze),
    silver: Math.max(0, later.silver - earlier.silver),
    gold: Math.max(0, later.gold - earlier.gold),
    platinum: Math.max(0, later.platinum - earlier.platinum),
  };
}

/**
 * Trophies earned between each consecutive snapshot pair (rate of earning, not
 * running totals), oldest interval first. Fewer than two snapshots means no
 * interval, so the result is empty — a normal state until auto-sync accumulates
 * history.
 */
export function trophyPace(snapshots: PlayerSnapshot[]): TrophyPaceInterval[] {
  // Roll each snapshot up once (not twice per interval), so the interval loop is
  // O(n) over snapshots rather than O(2·(n-1)) full reductions.
  const trophyTotals = snapshots.map((snapshot) => playerTotals(snapshot).trophies);

  const intervals: TrophyPaceInterval[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const earned = tierDelta(trophyTotals[i]!, trophyTotals[i - 1]!);
    intervals.push({
      from: snapshots[i - 1]!.capturedAt,
      to: snapshots[i]!.capturedAt,
      earned,
      total: totalTrophies(earned),
    });
  }
  return intervals;
}
