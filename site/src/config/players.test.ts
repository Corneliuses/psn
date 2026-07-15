import { describe, expect, it } from 'vitest';

import psnConfig from '../../../psn.config.json';
import { playerByKey, players } from './players';

describe('players config', () => {
  it('is sourced from psn.config.json, not hardcoded', () => {
    expect(players).toEqual(psnConfig.players.map(({ key, displayName }) => ({ key, displayName })));
  });

  it('finds a player by key', () => {
    expect(playerByKey('dad')?.displayName).toBe('Dad');
    expect(playerByKey('braidan')?.displayName).toBe('Braidan');
  });

  it('returns undefined for an unknown key', () => {
    expect(playerByKey('stranger')).toBeUndefined();
  });
});
