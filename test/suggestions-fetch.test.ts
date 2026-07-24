import { describe, expect, it, vi } from 'vitest';

import {
  fetchGenreSlugs,
  fetchSuggestionsForGenres,
  matchOwnedTitles,
  type OwnedGame,
  type RawgDeps,
} from '../src/suggestions/index.js';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function deps(fetchImpl: typeof fetch): RawgDeps {
  return { fetch: fetchImpl, apiKey: 'test-key', delayMs: 0 };
}

describe('matchOwnedTitles', () => {
  it('matches each owned game to its best RAWG candidate and extracts genres', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        results: [
          { id: 1, name: 'Rocket League', slug: 'rocket-league', released: '2015-07-07', metacritic: 86, genres: [{ name: 'Sports', slug: 'sports' }] },
        ],
      }),
    );
    const games: OwnedGame[] = [
      { key: 'rocket league', searchName: 'Rocket League', displayName: 'Rocket League®', minutes: 100, players: ['dad'] },
    ];

    const results = await matchOwnedTitles(games, deps(fetchMock as unknown as typeof fetch));

    expect(results.get('rocket league')).toEqual({
      rawgId: 1,
      matchedName: 'Rocket League',
      genres: ['Sports'],
    });
  });

  it('records a null match with no genres when RAWG returns nothing', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    const games: OwnedGame[] = [
      { key: 'unknown game', searchName: 'Unknown Game', displayName: 'Unknown Game', minutes: 10, players: ['dad'] },
    ];

    const results = await matchOwnedTitles(games, deps(fetchMock as unknown as typeof fetch));

    expect(results.get('unknown game')).toEqual({ rawgId: null, matchedName: null, genres: [] });
  });

  it('throws with the HTTP status on a non-ok response, never leaking the API key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, false, 429));
    const games: OwnedGame[] = [
      { key: 'x', searchName: 'X', displayName: 'X', minutes: 1, players: ['dad'] },
    ];

    await expect(matchOwnedTitles(games, deps(fetchMock as unknown as typeof fetch))).rejects.toThrow(
      'RAWG games failed: HTTP 429',
    );
  });

  it('spaces requests apart by delayMs', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    const games: OwnedGame[] = [
      { key: 'a', searchName: 'A', displayName: 'A', minutes: 1, players: ['dad'] },
      { key: 'b', searchName: 'B', displayName: 'B', minutes: 1, players: ['dad'] },
    ];

    const promise = matchOwnedTitles(games, { fetch: fetchMock as unknown as typeof fetch, apiKey: 'k', delayMs: 120 });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.runAllTimersAsync();
    await promise;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe('fetchGenreSlugs', () => {
  it('maps genre display names to RAWG slugs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ results: [{ name: 'Action', slug: 'action' }, { name: 'RPG', slug: 'role-playing-games-rpg' }] }),
    );
    const slugs = await fetchGenreSlugs(deps(fetchMock as unknown as typeof fetch));
    expect(slugs.get('Action')).toBe('action');
    expect(slugs.get('RPG')).toBe('role-playing-games-rpg');
  });
});

describe('fetchSuggestionsForGenres', () => {
  it('excludes owned titles and caps results per genre', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        results: [
          { id: 1, name: 'Owned Game', slug: 'owned-game', released: '2020-01-01', metacritic: 90, genres: [] },
          { id: 2, name: 'New Game', slug: 'new-game', released: '2021-01-01', metacritic: 80, genres: [] },
        ],
      }),
    );

    const out = await fetchSuggestionsForGenres(
      ['Action'],
      new Map([['Action', 'action']]),
      new Set(['owned game']),
      deps(fetchMock as unknown as typeof fetch),
      1,
    );

    expect(out.Action).toEqual([{ name: 'New Game', rawgId: 2, rating: 80, released: '2021-01-01' }]);
  });

  it('skips a genre with no known RAWG slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    const out = await fetchSuggestionsForGenres(
      ['Unknown Genre'],
      new Map(),
      new Set(),
      deps(fetchMock as unknown as typeof fetch),
    );
    expect(out).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
