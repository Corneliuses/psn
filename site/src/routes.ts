import { players } from './config/players';

export const COMPARE_PATH = '/compare';
export const DISCOVER_PATH = '/discover';
/** The companion-apps section: a grid of the games we play as a pair. */
export const TOGETHER_PATH = '/together';

export function playerPath(key: string): string {
  return `/${key}`;
}

/** The companion app for one title, e.g. '/together/grounded-2'. */
export function companionPath(slug: string): string {
  return `${TOGETHER_PATH}/${slug}`;
}

/** Route paths for every configured player, e.g. ['/dad', '/braidan']. */
export const playerPaths: string[] = players.map((player) => playerPath(player.key));
