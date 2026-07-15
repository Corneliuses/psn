import type { PlayerSnapshot } from 'psn';

// FIXTURE DATA: data/dad/latest.json and data/braidan/latest.json are
// placeholder snapshots (see sampleSnapshot() in the root package), not
// real synced PSN data. They exist so this JSON import resolves and
// typechecks; issue #8 (auto-sync) replaces them with real snapshots.
import dadSnapshot from '../../data/dad/latest.json';
import braidanSnapshot from '../../data/braidan/latest.json';

const snapshots: Partial<Record<string, PlayerSnapshot>> = {
  dad: dadSnapshot as PlayerSnapshot,
  braidan: braidanSnapshot as PlayerSnapshot,
};

export function snapshotByKey(key: string): PlayerSnapshot | undefined {
  return snapshots[key];
}
