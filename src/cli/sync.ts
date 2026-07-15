/**
 * Sync PSN snapshots for every configured player (or one, via --player).
 *
 *   pnpm sync                 # real sync; needs NPSSO_* env vars (.env supported)
 *   pnpm sync --dry-run       # fixture data, no credentials, exercises the pipeline
 *   pnpm sync --player dad    # limit to one player
 */
import { parseArgs } from 'node:util';

import { sampleSnapshot } from '../fixtures/sample.js';
import { authenticate } from '../psn/client.js';
import { fetchPlayerSnapshot } from '../psn/fetch.js';
import type { PlayerSnapshot } from '../psn/models.js';
import { writeSnapshot } from '../snapshot/store.js';
import { loadConfig, type PlayerConfig } from './config.js';

const DATA_DIR = 'data';

function loadDotEnvIfPresent(): void {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file — env vars may still be set directly (e.g. CI secrets).
  }
}

function requireToken(envVar: string): string {
  const token = process.env[envVar];
  if (!token) {
    throw new Error(
      `Missing ${envVar}. Copy .env.example to .env and set it (see the README for how to get an NPSSO token).`,
    );
  }
  return token;
}

async function syncPlayer(player: PlayerConfig, dryRun: boolean): Promise<PlayerSnapshot> {
  if (dryRun) {
    return sampleSnapshot(player.key, player.displayName, new Date().toISOString());
  }
  if (player.auth.mode === 'npsso') {
    const auth = await authenticate(requireToken(player.auth.envVar), player.auth.envVar);
    return fetchPlayerSnapshot(auth, player);
  }
  const auth = await authenticate(requireToken(player.auth.viaEnvVar), player.auth.viaEnvVar);
  return fetchPlayerSnapshot(auth, player, { accountId: player.auth.accountId });
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      player: { type: 'string' },
    },
  });
  const dryRun = values['dry-run'] ?? false;

  loadDotEnvIfPresent();
  const config = loadConfig('psn.config.json');

  const players = values.player
    ? config.players.filter((p) => p.key === values.player)
    : config.players;
  if (players.length === 0) {
    const known = config.players.map((p) => p.key).join(', ');
    throw new Error(`Unknown player "${values.player}". Configured players: ${known}`);
  }

  let failures = 0;
  for (const player of players) {
    try {
      const snapshot = await syncPlayer(player, dryRun);
      const { datedPath } = writeSnapshot(DATA_DIR, snapshot);
      console.log(
        `✓ ${player.displayName}: ${snapshot.playedTitles.length} played titles, ` +
          `${snapshot.trophyTitles.length} trophy titles → ${datedPath}${dryRun ? ' (dry run)' : ''}`,
      );
    } catch (error) {
      failures++;
      console.error(`✗ ${player.displayName}: ${error instanceof Error ? error.message : error}`);
    }
  }
  if (failures > 0) process.exit(1);
}

await main();
