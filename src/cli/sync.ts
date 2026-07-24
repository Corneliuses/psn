/**
 * Sync PSN snapshots for every configured player (or one, via --player), then
 * refresh data/suggestions.json (see src/suggestions/) from RAWG.
 *
 *   pnpm sync                 # real sync; needs NPSSO_* env vars (.env supported)
 *   pnpm sync --dry-run       # fixture data, no credentials, exercises the pipeline
 *   pnpm sync --player dad    # limit to one player
 *   pnpm sync --no-suggestions   # skip the RAWG suggestions refresh
 *
 * Suggestions need RAWG_API_KEY; a missing key (or --dry-run) skips them with
 * a warning rather than failing the sync.
 */
import { parseArgs } from 'node:util';

import { sampleSnapshot } from '../fixtures/sample.js';
import { authenticate } from '../psn/client.js';
import { fetchPlayerSnapshot } from '../psn/fetch.js';
import type { PlayerSnapshot } from '../psn/models.js';
import { writeSnapshot } from '../snapshot/store.js';
import { syncSuggestions } from '../suggestions/sync.js';
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
      'no-suggestions': { type: 'boolean', default: false },
    },
  });
  const dryRun = values['dry-run'] ?? false;
  const suggestionsEnabled = !(values['no-suggestions'] ?? false);

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

  if (suggestionsEnabled) {
    // Always built from every configured player's latest snapshot, even when
    // --player limited which snapshot(s) this run refreshed — shared-genre
    // suggestions need both players' data, not just the one that just synced.
    try {
      const result = await syncSuggestions({
        dataDir: DATA_DIR,
        players: config.players,
        dryRun,
        ...(process.env.RAWG_API_KEY ? { apiKey: process.env.RAWG_API_KEY } : {}),
      });
      if (!result.skipped) {
        console.log(
          `✓ Suggestions: ${result.matchedGenreCount} titles genre-matched, ` +
            `shared genres: ${(result.sharedGenres ?? []).join(', ') || 'none'}`,
        );
      }
    } catch (error) {
      console.error(
        `✗ Suggestions sync failed (non-fatal): ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  if (failures > 0) process.exit(1);
}

await main();
