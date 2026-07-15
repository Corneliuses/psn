import type { TrophyTitle as PsnTrophyTitle, UserPlayedGamesResponse } from 'psn-api';

import { durationToMinutes } from './duration.js';
import type { PlayedTitle, TrophyTitleStats } from './models.js';
import { totalTrophies } from './models.js';

export type RawPlayedTitle = UserPlayedGamesResponse['titles'][number];

export function mapPlayedTitle(raw: RawPlayedTitle): PlayedTitle {
  return {
    titleId: raw.titleId,
    name: raw.name,
    imageUrl: raw.imageUrl,
    category: raw.category,
    playCount: raw.playCount,
    playDurationIso: raw.playDuration,
    playDurationMinutes: durationToMinutes(raw.playDuration),
    firstPlayed: raw.firstPlayedDateTime,
    lastPlayed: raw.lastPlayedDateTime,
  };
}

export function mapTrophyTitle(raw: PsnTrophyTitle): TrophyTitleStats {
  return {
    npCommunicationId: raw.npCommunicationId,
    name: raw.trophyTitleName,
    platform: String(raw.trophyTitlePlatform),
    iconUrl: raw.trophyTitleIconUrl,
    defined: { ...raw.definedTrophies },
    earned: { ...raw.earnedTrophies },
    earnedTotal: totalTrophies(raw.earnedTrophies),
    progress: raw.progress,
    hasPlatinum: raw.earnedTrophies.platinum > 0,
    lastTrophyAt: raw.lastUpdatedDateTime,
  };
}
