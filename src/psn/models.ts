/** Trophy counts by tier, used for both defined and earned totals. */
export interface TrophyCounts {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}

/** One game from the player's play history. */
export interface PlayedTitle {
  titleId: string;
  name: string;
  imageUrl: string;
  /** e.g. "ps5_native_game", "ps4_game" */
  category: string;
  playCount: number;
  /** ISO 8601 duration as reported by PSN, e.g. "PT228H56M33S". */
  playDurationIso: string;
  /** Parsed from playDurationIso; rounded to the nearest minute. */
  playDurationMinutes: number;
  /** ISO 8601 datetime. */
  firstPlayed: string;
  /** ISO 8601 datetime. */
  lastPlayed: string;
}

/** Per-game trophy standing for a player. */
export interface TrophyTitleStats {
  npCommunicationId: string;
  name: string;
  platform: string;
  iconUrl: string;
  defined: TrophyCounts;
  earned: TrophyCounts;
  /** Sum of earned tiers. */
  earnedTotal: number;
  /** 0–100, as reported by PSN. */
  progress: number;
  hasPlatinum: boolean;
  /** ISO 8601 datetime of the most recently earned trophy. */
  lastTrophyAt: string;
}

export interface PlayerIdentity {
  /** Stable local key, e.g. "dad" — also the directory name under data/. */
  key: string;
  displayName: string;
  accountId?: string;
  onlineId?: string;
}

/** Everything the site needs about one player, captured at a point in time. */
export interface PlayerSnapshot {
  schemaVersion: 1;
  player: PlayerIdentity;
  /** ISO 8601 datetime the sync ran. */
  capturedAt: string;
  /** Sorted by titleId for diff-friendly snapshots. */
  playedTitles: PlayedTitle[];
  /** Sorted by npCommunicationId for diff-friendly snapshots. */
  trophyTitles: TrophyTitleStats[];
}

export function totalTrophies(counts: TrophyCounts): number {
  return counts.bronze + counts.silver + counts.gold + counts.platinum;
}
