import type { PlayedTitle, PlayerSnapshot } from '../psn/models.js';

/** Games ranked by total play time, longest first. Ties break by play count. */
export function mostPlayedGames(snapshot: PlayerSnapshot, limit = 10): PlayedTitle[] {
  return [...snapshot.playedTitles]
    .sort(
      (a, b) =>
        b.playDurationMinutes - a.playDurationMinutes || b.playCount - a.playCount,
    )
    .slice(0, limit);
}
