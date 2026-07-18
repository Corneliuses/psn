import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { PlayerSnapshot } from '../psn/models.js';

const DATED_FILE_RE = /^\d{4}-\d{2}-\d{2}\.json$/;

function serialize(snapshot: PlayerSnapshot): string {
  return JSON.stringify(snapshot, null, 2) + '\n';
}

/**
 * Write a snapshot as data/<player>/<YYYY-MM-DD>.json and mirror it to
 * latest.json. Same-day syncs overwrite that day's file, so history is at
 * most one snapshot per day.
 */
export function writeSnapshot(baseDir: string, snapshot: PlayerSnapshot): { datedPath: string; latestPath: string } {
  const day = snapshot.capturedAt.slice(0, 10);
  const dir = join(baseDir, snapshot.player.key);
  mkdirSync(dir, { recursive: true });

  const datedPath = join(dir, `${day}.json`);
  const latestPath = join(dir, 'latest.json');
  const contents = serialize(snapshot);
  writeFileSync(datedPath, contents);
  writeFileSync(latestPath, contents);
  return { datedPath, latestPath };
}

export function readLatestSnapshot(baseDir: string, playerKey: string): PlayerSnapshot {
  const raw = readFileSync(join(baseDir, playerKey, 'latest.json'), 'utf8');
  return JSON.parse(raw) as PlayerSnapshot;
}

/**
 * Read every dated snapshot for a player, oldest → newest — the full history the
 * trend analytics need, not just latest.json. Backed by listSnapshotDates, so
 * latest.json (a mirror of the newest dated file) is excluded and never
 * double-counted; an unknown player yields an empty array.
 */
export function readAllSnapshots(baseDir: string, playerKey: string): PlayerSnapshot[] {
  return listSnapshotDates(baseDir, playerKey).map((date) => {
    const raw = readFileSync(join(baseDir, playerKey, `${date}.json`), 'utf8');
    return JSON.parse(raw) as PlayerSnapshot;
  });
}

/** Dated snapshot filenames for a player, oldest first. */
export function listSnapshotDates(baseDir: string, playerKey: string): string[] {
  try {
    return readdirSync(join(baseDir, playerKey))
      .filter((f) => DATED_FILE_RE.test(f))
      .map((f) => f.replace('.json', ''))
      .sort();
  } catch {
    return [];
  }
}
