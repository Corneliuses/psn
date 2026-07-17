import { describe, expect, it } from 'vitest';

import { accentForKey } from './accents';
import { players } from './players';

const SHAPE_FILLS = [
  'fill-shape-triangle',
  'fill-shape-circle',
  'fill-shape-cross',
  'fill-shape-square',
];

describe('accentForKey', () => {
  it('assigns each configured player the shape token at its config index', () => {
    players.forEach((player, index) => {
      expect(accentForKey(player.key).fill).toBe(SHAPE_FILLS[index % SHAPE_FILLS.length]);
    });
  });

  it('gives distinct accents to the first two players (Dad vs Braidan)', () => {
    expect(accentForKey('dad').fill).not.toBe(accentForKey('braidan').fill);
  });

  it('is stable for the same key', () => {
    expect(accentForKey('dad')).toEqual(accentForKey('dad'));
  });

  it('falls back to the first accent for an unknown key', () => {
    expect(accentForKey('stranger').fill).toBe(SHAPE_FILLS[0]);
  });
});
