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

  it('with two players, returns genres both have time in, ranked by combined minutes', () => {
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

  describe('with three players', () => {
    const trio: MatchedGame[] = [
      // Action: all three, 300 + 300 + 300 = 900 combined.
      { key: 't1', searchName: 'T1', displayName: 'T1', minutes: 300, players: ['dad', 'braidan', 'nadia'], genres: ['Action'] },
      // Puzzle: exactly two (braidan + nadia), 500 + 500 = 1000 combined.
      { key: 't2', searchName: 'T2', displayName: 'T2', minutes: 500, players: ['braidan', 'nadia'], genres: ['Puzzle'] },
      // Racing: only dad, but the most minutes of any genre.
      { key: 't3', searchName: 'T3', displayName: 'T3', minutes: 5000, players: ['dad'], genres: ['Racing'] },
      // Shooter: all three via separate titles, 100 + 100 + 100 = 300 combined.
      { key: 't4', searchName: 'T4', displayName: 'T4', minutes: 100, players: ['dad'], genres: ['Shooter'] },
      { key: 't5', searchName: 'T5', displayName: 'T5', minutes: 100, players: ['braidan'], genres: ['Shooter'] },
      { key: 't6', searchName: 'T6', displayName: 'T6', minutes: 100, players: ['nadia'], genres: ['Shooter'] },
    ];

    it('includes genres exactly two players share, ranked with all-three genres by combined minutes', () => {
      expect(sharedGenres(buildGenreProfile(trio))).toEqual(['Puzzle', 'Action', 'Shooter']);
    });

    it('excludes a genre only one player has time in, however many minutes', () => {
      expect(sharedGenres(buildGenreProfile(trio), 10)).not.toContain('Racing');
    });

    it('finds a two-player genre the first player in the profile never played', () => {
      const profile = buildGenreProfile(trio);
      expect(Object.keys(profile)[0]).toBe('dad');
      expect(profile.dad?.Puzzle).toBeUndefined();
      expect(sharedGenres(profile, 1)).toEqual(['Puzzle']);
    });
  });

  it('returns empty for a single player', () => {
    expect(sharedGenres({ dad: { Action: 100 } })).toEqual([]);
  });
});
