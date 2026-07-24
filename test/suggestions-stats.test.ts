import { describe, expect, it } from 'vitest';

import type { PlayerSnapshot } from '../src/psn/models.js';
import {
  buildGenreProfile,
  cleanTitleName,
  collectLibrary,
  sharedGenres,
  topGenresForPlayer,
  type MatchedGame,
} from '../src/suggestions/index.js';

const empty: PlayerSnapshot = {
  schemaVersion: 1,
  player: { key: 'nobody', displayName: 'Nobody' },
  capturedAt: '2026-07-15T00:00:00.000Z',
  playedTitles: [],
  trophyTitles: [],
};

function playedTitle(overrides: Partial<PlayerSnapshot['playedTitles'][number]>) {
  return {
    titleId: 'TID_00',
    name: 'Game',
    imageUrl: 'https://image.example/g.png',
    category: 'ps5_native_game',
    playCount: 1,
    playDurationIso: 'PT1H',
    playDurationMinutes: 60,
    firstPlayed: '2026-01-01T00:00:00Z',
    lastPlayed: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('cleanTitleName', () => {
  it('strips trademark glyphs, platform suffixes, and bundle/edition tags', () => {
    expect(cleanTitleName('Rocket League®')).toBe('Rocket League');
    expect(cleanTitleName('Ghost of Tsushima (PlayStation®5)')).toBe('Ghost of Tsushima');
    expect(cleanTitleName('Some Game PS4 & PS5')).toBe('Some Game');
    expect(cleanTitleName('Big Game PS5 Edition')).toBe('Big Game');
  });
});

describe('collectLibrary', () => {
  it('filters to real games, dedupes cross-platform variants, and merges playtime across players', () => {
    const dad: PlayerSnapshot = {
      ...empty,
      player: { key: 'dad', displayName: 'Dad' },
      playedTitles: [
        playedTitle({ titleId: 'A', name: 'Rocket League®', category: 'ps4_game', playDurationMinutes: 120 }),
        playedTitle({ titleId: 'B', name: 'Hulu', category: 'media_app', playDurationMinutes: 999 }),
      ],
    };
    const braidan: PlayerSnapshot = {
      ...empty,
      player: { key: 'braidan', displayName: 'Braidan' },
      playedTitles: [
        playedTitle({ titleId: 'A', name: 'Rocket League', category: 'ps5_native_game', playDurationMinutes: 60 }),
      ],
    };

    const library = collectLibrary(new Map([['dad', dad], ['braidan', braidan]]));

    expect(library).toHaveLength(1);
    expect(library[0]).toMatchObject({
      key: 'rocket league',
      minutes: 180,
      players: ['dad', 'braidan'],
    });
  });

  it('returns empty for snapshots with no real games', () => {
    expect(collectLibrary(new Map([['nobody', empty]]))).toEqual([]);
  });
});

describe('buildGenreProfile / topGenresForPlayer / sharedGenres', () => {
  const games: MatchedGame[] = [
    { key: 'a', searchName: 'A', displayName: 'A', minutes: 600, players: ['dad', 'braidan'], genres: ['Action', 'RPG'] },
    { key: 'b', searchName: 'B', displayName: 'B', minutes: 300, players: ['dad'], genres: ['Racing'] },
    { key: 'c', searchName: 'C', displayName: 'C', minutes: 120, players: ['braidan'], genres: ['RPG'] },
  ];

  it('builds a playtime-weighted profile per player', () => {
    const profile = buildGenreProfile(games);
    expect(profile.dad).toEqual({ Action: 600, RPG: 600, Racing: 300 });
    expect(profile.braidan).toEqual({ Action: 600, RPG: 720 });
  });

  it('ranks a player\'s top genres by minutes', () => {
    const profile = buildGenreProfile(games);
    expect(topGenresForPlayer(profile, 'dad', 2)).toEqual(['Action', 'RPG']);
  });

  it('returns empty for an unknown player', () => {
    const profile = buildGenreProfile(games);
    expect(topGenresForPlayer(profile, 'stranger')).toEqual([]);
  });

  it('returns only genres every player has time in, ranked by combined minutes', () => {
    const profile = buildGenreProfile(games);
    expect(sharedGenres(profile)).toEqual(['RPG', 'Action']);
  });

  it('caps the shared list to the requested count', () => {
    const profile = buildGenreProfile(games);
    expect(sharedGenres(profile, 1)).toEqual(['RPG']);
  });

  it('returns empty when there are no players', () => {
    expect(sharedGenres({})).toEqual([]);
  });
});
