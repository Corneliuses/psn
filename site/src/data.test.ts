import { describe, expect, it } from 'vitest';

import { snapshotByKey } from './data';

describe('snapshotByKey', () => {
  it('loads a PlayerSnapshot for each configured player via Vite JSON import', () => {
    expect(snapshotByKey('dad')?.player.key).toBe('dad');
    expect(snapshotByKey('braidan')?.player.key).toBe('braidan');
  });

  it('returns undefined for an unconfigured key', () => {
    expect(snapshotByKey('stranger')).toBeUndefined();
  });
});
