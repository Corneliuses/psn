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

  it('gives distinct accents to the first two configured players', () => {
    const [first, second] = players;
    expect(accentForKey(first!.key).fill).not.toBe(accentForKey(second!.key).fill);
  });

  it('is stable for the same key', () => {
    const key = players[0]!.key;
    expect(accentForKey(key)).toEqual(accentForKey(key));
  });

  it('falls back to the first accent for an unknown key', () => {
    expect(accentForKey('stranger').fill).toBe(SHAPE_FILLS[0]);
  });

  it('exposes the matching CSS color variable for each accent', () => {
    players.forEach((player) => {
      const accent = accentForKey(player.key);
      // e.g. fill-shape-circle → var(--color-shape-circle)
      const shape = accent.fill.replace('fill-', '');
      expect(accent.colorVar).toBe(`var(--color-${shape})`);
    });
  });
});
