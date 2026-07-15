import type { PlayedTitle, PlayerSnapshot } from '../psn/models.js';

/** Most recently played games, newest first. */
export function recentGames(snapshot: PlayerSnapshot, limit = 10): PlayedTitle[] {
  return [...snapshot.playedTitles]
    .sort((a, b) => Date.parse(b.lastPlayed) - Date.parse(a.lastPlayed))
    .slice(0, limit);
}
