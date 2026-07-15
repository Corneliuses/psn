import { readFileSync } from 'node:fs';

/** Player signs in with their own NPSSO token. */
interface NpssoAuth {
  mode: 'npsso';
  envVar: string;
}

/**
 * Player is fetched through another account's session (must be friends with
 * trophy/game visibility allowed). `viaEnvVar` names the authenticating
 * token; `accountId` is the target player's numeric PSN account ID.
 */
interface FriendAuth {
  mode: 'friend';
  viaEnvVar: string;
  accountId: string;
}

export interface PlayerConfig {
  key: string;
  displayName: string;
  auth: NpssoAuth | FriendAuth;
}

export interface SyncConfig {
  players: PlayerConfig[];
}

export function loadConfig(path: string): SyncConfig {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as SyncConfig;
  if (!Array.isArray(parsed.players) || parsed.players.length === 0) {
    throw new Error(`${path}: "players" must be a non-empty array`);
  }
  for (const player of parsed.players) {
    if (!player.key || !player.displayName || !player.auth?.mode) {
      throw new Error(`${path}: each player needs key, displayName, and auth.mode`);
    }
    if (player.auth.mode === 'npsso' && !player.auth.envVar) {
      throw new Error(`${path}: player "${player.key}" auth.mode "npsso" requires envVar`);
    }
    if (player.auth.mode === 'friend' && (!player.auth.viaEnvVar || !player.auth.accountId)) {
      throw new Error(`${path}: player "${player.key}" auth.mode "friend" requires viaEnvVar and accountId`);
    }
  }
  return parsed;
}
