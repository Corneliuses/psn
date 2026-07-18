/**
 * Normalize a title name for cross-platform matching so, e.g., "Rocket League®"
 * (PS4) matches "Rocket League" (PS5). Shared by every stat that pairs a played
 * title with a trophy title, or one player's library with another's.
 */
export function nameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
