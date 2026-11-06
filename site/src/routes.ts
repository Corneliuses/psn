import { players, type PlayerConfig } from './config/players';

export const COMPARE_PATH = '/compare';
export const DISCOVER_PATH = '/discover';
/** The companion-apps section: a grid of the games we play as a pair. */
export const TOGETHER_PATH = '/together';
/** The game help desk: the controlled chat bot. */
export const HELP_PATH = '/help';

export function playerPath(key: string): string {
  return `/${key}`;
}

/** The help desk, optionally pre-selecting a game, e.g. '/help?game=Grounded+2'. */
export function helpPath(game?: string): string {
  return game ? `${HELP_PATH}?${new URLSearchParams({ game }).toString()}` : HELP_PATH;
}

/** The companion app for one title, e.g. '/together/grounded-2'. */
export function companionPath(slug: string): string {
  return `${TOGETHER_PATH}/${slug}`;
}

/** The pairwise compare page for two player keys, e.g. '/compare/dad/braidan'. */
export function comparePath(a: string, b: string): string {
  return `${COMPARE_PATH}/${a}/${b}`;
}

/** Two players matched up on a pairwise compare page. */
export interface PlayerPairing {
  a: PlayerConfig;
  b: PlayerConfig;
}

/**
 * Every 2-combination of `players`, in config order: player i is always `a`
 * against each later player `b`. 2 players give 1 pairing, 3 give 3.
 */
export const playerPairings: PlayerPairing[] = players.flatMap((a, i) =>
  players.slice(i + 1).map((b) => ({ a, b })),
);

/** Route paths for every configured player, e.g. ['/dad', '/braidan']. */
export const playerPaths: string[] = players.map((player) => playerPath(player.key));
