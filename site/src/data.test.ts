import { describe, expect, it } from 'vitest';

import { snapshotsByKey } from './data';

describe('snapshotsByKey', () => {
  it('loads a PlayerSnapshot for each configured player via Vite JSON import', () => {
    expect(snapshotsByKey.dad?.player.key).toBe('dad');
    expect(snapshotsByKey.braidan?.player.key).toBe('braidan');
  });
});
