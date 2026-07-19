import type { PlayerSnapshot, TrophyTitleStats } from '../psn/models.js';
import { nameKey } from './names.js';

/** A single-snapshot completion picture for one player. */
export interface CompletionScoreboard {
  /** Titles a platinum away: progress >= 90 and no platinum yet, closest first. */
  nearPlatinum: TrophyTitleStats[];
  /** Played titles with no matching trophy title, or with nothing earned in it. */
  untouchedBacklog: number;
  /** Average `progress` across trophy titles (0 when there are none). */
  averageProgress: number;
}

const NEAR_PLATINUM_THRESHOLD = 90;

/**
 * Roll a single snapshot into a completion scoreboard: the near-platinum chase
 * list, a count of the untouched backlog, and average progress across trophy
 * titles. Played↔trophy titles are matched by the shared name normalizer so a
 * PS4/PS5 naming difference doesn't inflate the backlog.
 */
export function completionScoreboard(snapshot: PlayerSnapshot): CompletionScoreboard {
  const nearPlatinum = snapshot.trophyTitles
    .filter((t) => t.progress >= NEAR_PLATINUM_THRESHOLD && !t.hasPlatinum)
    .sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name));

  // Normalized names with at least one earned trophy. Keyed as a Set (not a
  // last-wins Map) so a title with separate PS4/PS5 trophy sets counts as
  // touched when *any* variant has earned trophies, not just the last one seen.
  const earnedNames = new Set(
    snapshot.trophyTitles.filter((t) => t.earnedTotal > 0).map((t) => nameKey(t.name)),
  );
  const untouchedBacklog = snapshot.playedTitles.filter(
    (played) => !earnedNames.has(nameKey(played.name)),
  ).length;

  const averageProgress =
    snapshot.trophyTitles.length === 0
      ? 0
      : snapshot.trophyTitles.reduce((sum, t) => sum + t.progress, 0) /
        snapshot.trophyTitles.length;

  return { nearPlatinum, untouchedBacklog, averageProgress };
}
