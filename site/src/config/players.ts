import psnConfig from '../../../psn.config.json';

export interface PlayerConfig {
  key: string;
  displayName: string;
}

/** Player identity/labels, sourced from psn.config.json — never hardcode player keys elsewhere. */
export const players: PlayerConfig[] = psnConfig.players.map(({ key, displayName }) => ({ key, displayName }));

export function playerByKey(key: string): PlayerConfig | undefined {
  return players.find((player) => player.key === key);
}
