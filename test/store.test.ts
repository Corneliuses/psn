import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { sampleSnapshot } from '../src/fixtures/sample.js';
import {
  listSnapshotDates,
  readAllSnapshots,
  readLatestSnapshot,
  writeSnapshot,
} from '../src/snapshot/store.js';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'psn-store-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('snapshot store', () => {
  it('writes a dated file plus latest.json and reads back identically', () => {
    const snapshot = sampleSnapshot('dad', 'Dad', '2026-07-15T04:00:00.000Z');
    const { datedPath, latestPath } = writeSnapshot(dir, snapshot);

    expect(datedPath.endsWith(join('dad', '2026-07-15.json'))).toBe(true);
    expect(readLatestSnapshot(dir, 'dad')).toEqual(snapshot);
    expect(readFileSync(datedPath, 'utf8')).toBe(readFileSync(latestPath, 'utf8'));
  });

  it('keeps latest.json in step with the newest dated snapshot', () => {
    writeSnapshot(dir, sampleSnapshot('dad', 'Dad', '2026-07-14T04:00:00.000Z'));
    writeSnapshot(dir, sampleSnapshot('dad', 'Dad', '2026-07-15T04:00:00.000Z'));

    expect(readLatestSnapshot(dir, 'dad').capturedAt).toBe('2026-07-15T04:00:00.000Z');
    expect(listSnapshotDates(dir, 'dad')).toEqual(['2026-07-14', '2026-07-15']);
  });

  it('emits stable, diff-friendly JSON (2-space indent, trailing newline)', () => {
    const { datedPath } = writeSnapshot(dir, sampleSnapshot('dad', 'Dad'));
    const contents = readFileSync(datedPath, 'utf8');
    expect(contents.endsWith('}\n')).toBe(true);
    expect(contents).toContain('\n  "schemaVersion": 1,');
  });

  it('returns an empty date list for unknown players', () => {
    expect(listSnapshotDates(dir, 'stranger')).toEqual([]);
  });
});

describe('readAllSnapshots', () => {
  it('reads every dated snapshot oldest → newest, excluding latest.json', () => {
    writeSnapshot(dir, sampleSnapshot('dad', 'Dad', '2026-07-13T04:00:00.000Z'));
    writeSnapshot(dir, sampleSnapshot('dad', 'Dad', '2026-07-15T04:00:00.000Z'));
    writeSnapshot(dir, sampleSnapshot('dad', 'Dad', '2026-07-14T04:00:00.000Z'));

    const history = readAllSnapshots(dir, 'dad');
    // Three dated files, not four — latest.json (a mirror) is never counted.
    expect(history.map((s) => s.capturedAt)).toEqual([
      '2026-07-13T04:00:00.000Z',
      '2026-07-14T04:00:00.000Z',
      '2026-07-15T04:00:00.000Z',
    ]);
  });

  it('returns an empty array for an unknown player', () => {
    expect(readAllSnapshots(dir, 'stranger')).toEqual([]);
  });
});
