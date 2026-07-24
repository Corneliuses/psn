import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sampleSnapshot } from '../src/fixtures/sample.js';
import { writeSnapshot } from '../src/snapshot/store.js';
import { loadCache } from '../src/suggestions/cache.js';
import { syncSuggestions } from '../src/suggestions/sync.js';
import type { SuggestionsFile } from '../src/suggestions/types.js';

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: () => Promise.resolve(body) } as unknown as Response;
}

/**
 * Every owned-title search matches with a genre of "Action"; the genre
 * lookup returns one slug; and per-genre suggestions return one owned title
 * (to verify exclusion) plus one new one.
 */
function rawgHandler(input: string | URL): Promise<Response> {
  const url = new URL(input);
  if (url.pathname === '/api/genres') {
    return Promise.resolve(jsonResponse({ results: [{ name: 'Action', slug: 'action' }] }));
  }
  if (url.searchParams.has('search')) {
    const search = url.searchParams.get('search')!;
    return Promise.resolve(
      jsonResponse({
        results: [{ id: 1, name: search, slug: 'x', released: '2020-01-01', metacritic: 80, genres: [{ name: 'Action', slug: 'action' }] }],
      }),
    );
  }
  if (url.searchParams.has('genres')) {
    return Promise.resolve(
      jsonResponse({
        results: [
          { id: 999, name: 'Rocket League', slug: 'rocket-league', released: '2015-01-01', metacritic: 86, genres: [] },
          { id: 2, name: 'Brand New Game', slug: 'brand-new-game', released: '2024-01-01', metacritic: 90, genres: [] },
        ],
      }),
    );
  }
  return Promise.resolve(jsonResponse({ results: [] }));
}

function mockRawg(): typeof fetch {
  return vi.fn(rawgHandler) as unknown as typeof fetch;
}

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'psn-suggestions-'));
  writeSnapshot(dir, sampleSnapshot('dad', 'Dad', '2026-07-15T00:00:00.000Z'));
  writeSnapshot(dir, sampleSnapshot('braidan', 'Braidan', '2026-07-15T00:00:00.000Z'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const players = [
  { key: 'dad', displayName: 'Dad' },
  { key: 'braidan', displayName: 'Braidan' },
];

describe('syncSuggestions', () => {
  it('writes suggestions.json shaped per the schema, excluding owned titles', async () => {
    const result = await syncSuggestions({
      dataDir: dir,
      players,
      apiKey: 'test-key',
      fetch: mockRawg(),
      delayMs: 0,
      now: () => new Date('2026-07-24T00:00:00.000Z'),
    });

    expect(result.skipped).toBe(false);
    expect(result.sharedGenres).toEqual(['Action']);

    const file = JSON.parse(readFileSync(join(dir, 'suggestions.json'), 'utf8')) as SuggestionsFile;
    expect(file.shared_genres).toEqual(['Action']);
    expect(file.by_genre.Action).toEqual([{ name: 'Brand New Game', rawgId: 2, rating: 90, released: '2024-01-01' }]);
    expect(file.metadata).toEqual({
      generated_at: '2026-07-24T00:00:00.000Z',
      rawg_base_url: 'https://rawg.io',
      attribution: 'Data from RAWG.io',
      build: 'v0.1.0',
    });
  });

  it('never leaves a .tmp file behind (atomic write)', async () => {
    await syncSuggestions({ dataDir: dir, players, apiKey: 'test-key', fetch: mockRawg(), delayMs: 0 });
    expect(existsSync(join(dir, 'suggestions.json.tmp'))).toBe(false);
  });

  it('writes a title→genre cache and reuses it on the next sync (no re-fetch for cached titles)', async () => {
    await syncSuggestions({ dataDir: dir, players, apiKey: 'test-key', fetch: mockRawg(), delayMs: 0 });
    const cache = loadCache(join(dir, 'suggestions-cache.json'));
    expect(Object.keys(cache).length).toBeGreaterThan(0);
    expect(cache['rocket league']).toMatchObject({ genres: ['Action'] });

    const secondFetch = vi.fn(rawgHandler);
    await syncSuggestions({
      dataDir: dir,
      players,
      apiKey: 'test-key',
      fetch: secondFetch as unknown as typeof fetch,
      delayMs: 0,
    });
    const searchCalls = secondFetch.mock.calls.filter(([input]) => new URL(input).searchParams.has('search'));
    expect(searchCalls).toHaveLength(0);
  });

  it('applies curated overrides (hide + add) before writing', async () => {
    writeFileSync(
      join(dir, 'suggestions-overrides.json'),
      JSON.stringify({ hide: [2], add: { Action: [{ name: 'Curated Pick', rawgId: 42, rating: null, released: null }] } }),
    );

    const result = await syncSuggestions({ dataDir: dir, players, apiKey: 'test-key', fetch: mockRawg(), delayMs: 0 });
    expect(result.skipped).toBe(false);

    const file = JSON.parse(readFileSync(join(dir, 'suggestions.json'), 'utf8')) as SuggestionsFile;
    expect(file.by_genre.Action).toEqual([{ name: 'Curated Pick', rawgId: 42, rating: null, released: null }]);
  });

  it('skips on --dry-run and leaves any existing file untouched', async () => {
    writeFileSync(join(dir, 'suggestions.json'), '"sentinel"\n');
    const result = await syncSuggestions({ dataDir: dir, players, apiKey: 'test-key', dryRun: true, fetch: mockRawg() });
    expect(result).toEqual({ skipped: true, reason: 'dry run' });
    expect(readFileSync(join(dir, 'suggestions.json'), 'utf8')).toBe('"sentinel"\n');
  });

  it('skips with a warning when RAWG_API_KEY is absent and leaves any existing file untouched', async () => {
    writeFileSync(join(dir, 'suggestions.json'), '"sentinel"\n');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await syncSuggestions({ dataDir: dir, players, fetch: mockRawg() });

    expect(result).toEqual({ skipped: true, reason: 'missing RAWG_API_KEY' });
    expect(readFileSync(join(dir, 'suggestions.json'), 'utf8')).toBe('"sentinel"\n');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
