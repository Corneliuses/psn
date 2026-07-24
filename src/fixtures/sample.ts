/**
 * Representative sample data for two players with overlapping and disjoint
 * game libraries. Used by unit tests and by `pnpm sync --dry-run` so the
 * whole pipeline runs with zero PSN credentials. Shapes mirror what
 * psn-api returns (see src/psn/map.ts raw types).
 */
import type { RawPlayedTitle } from '../psn/map.js';
import { mapPlayedTitle, mapTrophyTitle } from '../psn/map.js';
import type { PlayerSnapshot } from '../psn/models.js';
import type { SuggestionsFile } from '../suggestions/types.js';
import type { TrophyTitle as PsnTrophyTitle } from 'psn-api';

function rawPlayed(overrides: Partial<RawPlayedTitle> & Pick<RawPlayedTitle, 'titleId' | 'name'>): RawPlayedTitle {
  return {
    localizedName: overrides.name,
    imageUrl: `https://image.example/${overrides.titleId}.png`,
    localizedImageUrl: `https://image.example/${overrides.titleId}.png`,
    category: 'ps5_native_game',
    service: 'none_purchased',
    playCount: 10,
    concept: { id: 1, titleIds: [overrides.titleId], name: overrides.name, media: { audios: [], videos: [], images: [] } },
    media: {},
    firstPlayedDateTime: '2025-01-01T12:00:00Z',
    lastPlayedDateTime: '2026-07-01T12:00:00Z',
    playDuration: 'PT10H',
    ...overrides,
  };
}

function rawTrophy(
  overrides: Partial<PsnTrophyTitle> & Pick<PsnTrophyTitle, 'npCommunicationId' | 'trophyTitleName'>,
): PsnTrophyTitle {
  return {
    npServiceName: 'trophy2',
    trophySetVersion: '01.00',
    trophyTitleIconUrl: `https://image.example/${overrides.npCommunicationId}.png`,
    trophyTitlePlatform: 'PS5',
    hasTrophyGroups: false,
    definedTrophies: { bronze: 20, silver: 10, gold: 5, platinum: 1 },
    progress: 50,
    earnedTrophies: { bronze: 10, silver: 5, gold: 2, platinum: 0 },
    hiddenFlag: false,
    lastUpdatedDateTime: '2026-06-15T20:00:00Z',
    ...overrides,
  };
}

const DAD_PLAYED: RawPlayedTitle[] = [
  rawPlayed({ titleId: 'PPSA01325_00', name: 'God of War Ragnarök', playDuration: 'PT82H14M9S', playCount: 61, lastPlayedDateTime: '2026-07-10T21:30:00Z' }),
  rawPlayed({ titleId: 'PPSA07950_00', name: 'Elden Ring', playDuration: 'PT210H3M44S', playCount: 148, lastPlayedDateTime: '2026-07-13T22:05:00Z' }),
  rawPlayed({ titleId: 'CUSA01433_00', name: 'Rocket League®', category: 'ps4_game', playDuration: 'PT96H40M', playCount: 203, lastPlayedDateTime: '2026-07-14T19:12:00Z' }),
  rawPlayed({ titleId: 'PPSA02342_00', name: 'Gran Turismo 7', playDuration: 'PT44H52M31S', playCount: 39, lastPlayedDateTime: '2026-05-20T18:45:00Z' }),
];

const DAD_TROPHIES: PsnTrophyTitle[] = [
  rawTrophy({ npCommunicationId: 'NPWR22859_00', trophyTitleName: 'God of War Ragnarök', earnedTrophies: { bronze: 26, silver: 12, gold: 4, platinum: 1 }, definedTrophies: { bronze: 26, silver: 15, gold: 4, platinum: 1 }, progress: 89 }),
  rawTrophy({ npCommunicationId: 'NPWR23407_00', trophyTitleName: 'Elden Ring', earnedTrophies: { bronze: 28, silver: 11, gold: 2, platinum: 0 }, definedTrophies: { bronze: 28, silver: 13, gold: 3, platinum: 1 }, progress: 78 }),
  rawTrophy({ npCommunicationId: 'NPWR06904_00', trophyTitleName: 'Rocket League®', trophyTitlePlatform: 'PS4', npServiceName: 'trophy', earnedTrophies: { bronze: 30, silver: 20, gold: 15, platinum: 1 }, definedTrophies: { bronze: 30, silver: 20, gold: 15, platinum: 1 }, progress: 100 }),
];

const BRAIDAN_PLAYED: RawPlayedTitle[] = [
  rawPlayed({ titleId: 'CUSA01433_00', name: 'Rocket League®', category: 'ps4_game', playDuration: 'PT301H12M55S', playCount: 512, lastPlayedDateTime: '2026-07-14T20:00:00Z' }),
  rawPlayed({ titleId: 'PPSA04873_00', name: 'Fortnite', playDuration: 'PT188H30M2S', playCount: 344, lastPlayedDateTime: '2026-07-14T21:10:00Z' }),
  rawPlayed({ titleId: 'PPSA13195_00', name: 'Astro Bot', playDuration: 'PT31H8M17S', playCount: 25, lastPlayedDateTime: '2026-07-05T16:20:00Z' }),
  rawPlayed({ titleId: 'PPSA01325_00', name: 'God of War Ragnarök', playDuration: 'PT12H2M', playCount: 8, lastPlayedDateTime: '2026-04-11T17:00:00Z' }),
];

const BRAIDAN_TROPHIES: PsnTrophyTitle[] = [
  rawTrophy({ npCommunicationId: 'NPWR06904_00', trophyTitleName: 'Rocket League®', trophyTitlePlatform: 'PS4', npServiceName: 'trophy', earnedTrophies: { bronze: 25, silver: 14, gold: 8, platinum: 0 }, definedTrophies: { bronze: 30, silver: 20, gold: 15, platinum: 1 }, progress: 71 }),
  rawTrophy({ npCommunicationId: 'NPWR35123_00', trophyTitleName: 'Astro Bot', earnedTrophies: { bronze: 29, silver: 10, gold: 3, platinum: 1 }, definedTrophies: { bronze: 29, silver: 10, gold: 3, platinum: 1 }, progress: 100 }),
  rawTrophy({ npCommunicationId: 'NPWR22859_00', trophyTitleName: 'God of War Ragnarök', earnedTrophies: { bronze: 9, silver: 2, gold: 0, platinum: 0 }, definedTrophies: { bronze: 26, silver: 15, gold: 4, platinum: 1 }, progress: 21 }),
];

const RAW: Record<string, { played: RawPlayedTitle[]; trophies: PsnTrophyTitle[] }> = {
  dad: { played: DAD_PLAYED, trophies: DAD_TROPHIES },
  braidan: { played: BRAIDAN_PLAYED, trophies: BRAIDAN_TROPHIES },
};

export function sampleRawResponses(key: string): { played: RawPlayedTitle[]; trophies: PsnTrophyTitle[] } {
  const raw = RAW[key];
  if (!raw) throw new Error(`No sample data for player "${key}" (have: ${Object.keys(RAW).join(', ')})`);
  return raw;
}

export function sampleSnapshot(key: string, displayName: string, capturedAt = '2026-07-15T00:00:00.000Z'): PlayerSnapshot {
  const raw = sampleRawResponses(key);
  return {
    schemaVersion: 1,
    player: { key, displayName },
    capturedAt,
    playedTitles: raw.played.map(mapPlayedTitle).sort((a, b) => a.titleId.localeCompare(b.titleId)),
    trophyTitles: raw.trophies.map(mapTrophyTitle).sort((a, b) => a.npCommunicationId.localeCompare(b.npCommunicationId)),
  };
}

/**
 * Sample `data/suggestions.json` shape for tests and as the initial
 * committed file before a real RAWG-backed sync has run.
 */
export function sampleSuggestions(generatedAt = '2026-07-15T00:00:00.000Z'): SuggestionsFile {
  return {
    by_genre: {
      Action: [
        { name: 'Returnal', rawgId: 326243, rating: 86, released: '2021-04-30' },
        { name: 'Ghost of Tsushima', rawgId: 422635, rating: 83, released: '2020-07-17' },
      ],
      RPG: [{ name: 'Persona 5 Royal', rawgId: 326900, rating: 94, released: '2020-03-31' }],
    },
    shared_genres: ['Action', 'RPG'],
    metadata: {
      generated_at: generatedAt,
      rawg_base_url: 'https://rawg.io',
      attribution: 'Data from RAWG.io',
      build: 'v0.1.0',
    },
  };
}
