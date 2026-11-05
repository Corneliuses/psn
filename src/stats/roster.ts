import type { PlayerIdentity, PlayerSnapshot, PlayedTitle, TrophyTitleStats } from '../psn/models.js';
import { nameKey } from './names.js';
import { playerTotals, type PlayerTotals } from './totals.js';

/** One player's value for a roster metric. */
export interface RosterMetricValue {
  playerKey: string;
  value: number;
}

/**
 * A metric across the whole roster. `values` is index-aligned with
 * `RosterComparison.players`; `leaders` holds every player key tied for the
 * maximum value (a full tie lists everyone).
 */
export interface RosterMetric {
  metric: string;
  label: string;
  values: RosterMetricValue[];
  leaders: string[];
}

/** One player's side of a game every roster member has played. */
export interface RosterGameSide {
  playerKey: string;
  playtimeMinutes: number;
  trophiesEarned: number;
}

/** A title present in every snapshot's played list. */
export interface RosterSharedGame {
  /** Display name taken from the first snapshot (config order). */
  name: string;
  /** Index-aligned with `RosterComparison.players`. */
  players: RosterGameSide[];
}

export interface RosterComparison {
  players: PlayerIdentity[];
  /** Index-aligned with `players`. */
  totals: PlayerTotals[];
  metrics: RosterMetric[];
  sharedGames: RosterSharedGame[];
}

function rosterMetric(
  metricKey: string,
  label: string,
  snapshots: PlayerSnapshot[],
  totals: PlayerTotals[],
  pick: (totals: PlayerTotals) => number,
): RosterMetric {
  const values = snapshots.map((s, i) => ({ playerKey: s.player.key, value: pick(totals[i]!) }));
  const max = Math.max(...values.map((v) => v.value));
  return {
    metric: metricKey,
    label,
    values,
    leaders: values.filter((v) => v.value === max).map((v) => v.playerKey),
  };
}

/**
 * N-player comparison for the family scoreboard: per-metric values for every
 * player with the leader(s) identified, per-player totals, and the games every
 * player has played. Same metric set and labels as `comparePlayers`, and
 * shared games are sorted by combined playtime like `comparePlayers().sharedGames`.
 * Additive — `comparePlayers` keeps its two-sided `{a, b}` shape.
 */
export function compareRoster(snapshots: PlayerSnapshot[]): RosterComparison {
  const totals = snapshots.map(playerTotals);
  const playedMaps = snapshots.map(
    (s) => new Map<string, PlayedTitle>(s.playedTitles.map((t) => [nameKey(t.name), t])),
  );
  const trophyMaps = snapshots.map(
    (s) => new Map<string, TrophyTitleStats>(s.trophyTitles.map((t) => [nameKey(t.name), t])),
  );

  const [first] = snapshots;
  const sharedGames: RosterSharedGame[] = (first?.playedTitles ?? [])
    .map((t) => ({ title: t, key: nameKey(t.name) }))
    .filter(({ key }) => playedMaps.every((m) => m.has(key)))
    .map(({ title, key }) => ({
      name: title.name,
      players: snapshots.map((s, i) =>
        // The first player's side is the row's own title (and its first
        // trophy match), exactly as `comparePlayers` reports side `a`, so a
        // library with PS4 + PS5 entries of one game keeps each entry's own
        // playtime instead of collapsing both rows onto the last entry.
        i === 0
          ? {
              playerKey: s.player.key,
              playtimeMinutes: title.playDurationMinutes,
              trophiesEarned: s.trophyTitles.find((x) => nameKey(x.name) === key)?.earnedTotal ?? 0,
            }
          : {
              playerKey: s.player.key,
              playtimeMinutes: playedMaps[i]!.get(key)!.playDurationMinutes,
              trophiesEarned: trophyMaps[i]!.get(key)?.earnedTotal ?? 0,
            },
      ),
    }))
    .sort((x, y) => combinedPlaytime(y) - combinedPlaytime(x));

  const m = (key: string, label: string, pick: (t: PlayerTotals) => number) =>
    rosterMetric(key, label, snapshots, totals, pick);

  return {
    players: snapshots.map((s) => s.player),
    totals,
    metrics: [
      m('playtimeMinutes', 'Total play time (minutes)', (t) => t.playtimeMinutes),
      m('gamesPlayed', 'Games played', (t) => t.gamesPlayed),
      m('trophiesTotal', 'Total trophies', (t) => t.trophiesTotal),
      m('bronze', 'Bronze trophies', (t) => t.trophies.bronze),
      m('silver', 'Silver trophies', (t) => t.trophies.silver),
      m('gold', 'Gold trophies', (t) => t.trophies.gold),
      m('platinums', 'Platinum trophies', (t) => t.platinums),
      m('sharedGames', 'Shared games', () => sharedGames.length),
    ],
    sharedGames,
  };
}

function combinedPlaytime(game: RosterSharedGame): number {
  return game.players.reduce((sum, p) => sum + p.playtimeMinutes, 0);
}
