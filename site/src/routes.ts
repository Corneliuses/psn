import { players } from './config/players';

export const COMPARE_PATH = '/compare';
export const DISCOVER_PATH = '/discover';

export function playerPath(key: string): string {
  return `/${key}`;
}

/** Route paths for every configured player, e.g. ['/dad', '/braidan']. */
export const playerPaths: string[] = players.map((player) => playerPath(player.key));
