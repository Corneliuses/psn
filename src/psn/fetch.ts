import type { AuthorizationPayload } from 'psn-api';

import { psnApi } from './api.js';
import { withRetry, type RetryOptions } from './client.js';

const { getProfileFromAccountId, getUserPlayedGames, getUserTitles } = psnApi;
import { mapPlayedTitle, mapTrophyTitle } from './map.js';
import type { PlayerIdentity, PlayerSnapshot } from './models.js';

const PLAYED_PAGE_SIZE = 200;
const TROPHY_PAGE_SIZE = 250;

export interface FetchPlayerOptions {
  /** PSN account to fetch. Omit (or "me") for the authenticating account. */
  accountId?: string;
  retry?: RetryOptions;
  /** Injectable clock for tests. */
  now?: () => Date;
}

/**
 * Pull a player's full played-titles and trophy-titles lists and assemble a
 * snapshot. Results are sorted by stable IDs so committed snapshots diff
 * cleanly between syncs.
 */
export async function fetchPlayerSnapshot(
  auth: AuthorizationPayload,
  player: Pick<PlayerIdentity, 'key' | 'displayName'>,
  options: FetchPlayerOptions = {},
): Promise<PlayerSnapshot> {
  const accountId = options.accountId ?? 'me';
  const retry = options.retry ?? {};
  const now = options.now ?? (() => new Date());

  const playedTitles = [];
  for (let offset = 0; ; offset += PLAYED_PAGE_SIZE) {
    const page = await withRetry(
      () => getUserPlayedGames(auth, accountId, { limit: PLAYED_PAGE_SIZE, offset }),
      retry,
    );
    playedTitles.push(...page.titles.map(mapPlayedTitle));
    if (offset + PLAYED_PAGE_SIZE >= page.totalItemCount || page.titles.length === 0) break;
  }

  const trophyTitles = [];
  for (let offset = 0; ; offset += TROPHY_PAGE_SIZE) {
    const page = await withRetry(
      () => getUserTitles(auth, accountId, { limit: TROPHY_PAGE_SIZE, offset }),
      retry,
    );
    trophyTitles.push(...page.trophyTitles.map(mapTrophyTitle));
    if (offset + TROPHY_PAGE_SIZE >= page.totalItemCount || page.trophyTitles.length === 0) break;
  }

  const identity: PlayerIdentity = { key: player.key, displayName: player.displayName };
  if (accountId !== 'me') {
    identity.accountId = accountId;
    const profile = await withRetry(() => getProfileFromAccountId(auth, accountId), retry).catch(
      () => undefined,
    );
    if (profile?.onlineId) identity.onlineId = profile.onlineId;
  }

  return {
    schemaVersion: 1,
    player: identity,
    capturedAt: now().toISOString(),
    playedTitles: playedTitles.sort((a, b) => a.titleId.localeCompare(b.titleId)),
    trophyTitles: trophyTitles.sort((a, b) =>
      a.npCommunicationId.localeCompare(b.npCommunicationId),
    ),
  };
}
