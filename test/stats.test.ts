import { describe, expect, it } from 'vitest';

import { sampleSnapshot } from '../src/fixtures/sample.js';
import type { PlayerSnapshot } from '../src/psn/models.js';
import {
  comparePlayers,
  gamesWithMostTrophies,
  mostPlayedGames,
  platinumGames,
  playerTotals,
  recentGames,
} from '../src/stats/index.js';

const dad = sampleSnapshot('dad', 'Dad');
const braidan = sampleSnapshot('braidan', 'Braidan');

const empty: PlayerSnapshot = {
  schemaVersion: 1,
  player: { key: 'nobody', displayName: 'Nobody' },
  capturedAt: '2026-07-15T00:00:00.000Z',
  playedTitles: [],
  trophyTitles: [],
};

describe('recentGames', () => {
  it('orders by last played, newest first, and respects the limit', () => {
    const recent = recentGames(dad, 2);
    expect(recent.map((g) => g.name)).toEqual(['Rocket League®', 'Elden Ring']);
  });

  it('returns empty for an empty snapshot', () => {
    expect(recentGames(empty)).toEqual([]);
  });
});

describe('mostPlayedGames', () => {
  it('orders by play duration, longest first', () => {
    const top = mostPlayedGames(dad, 3);
    expect(top.map((g) => g.name)).toEqual(['Elden Ring', 'Rocket League®', 'God of War Ragnarök']);
  });

  it('breaks duration ties by play count', () => {
    const snapshot: PlayerSnapshot = {
      ...empty,
      playedTitles: [
        { ...dad.playedTitles[0]!, name: 'A', playDurationMinutes: 100, playCount: 5 },
        { ...dad.playedTitles[0]!, name: 'B', playDurationMinutes: 100, playCount: 50 },
      ],
    };
    expect(mostPlayedGames(snapshot).map((g) => g.name)).toEqual(['B', 'A']);
  });
});

describe('gamesWithMostTrophies', () => {
  it('orders by earned trophy count', () => {
    const top = gamesWithMostTrophies(dad, 2);
    expect(top[0]!.name).toBe('Rocket League®'); // 66 earned
    expect(top[1]!.name).toBe('God of War Ragnarök'); // 43 earned
  });
});

describe('platinumGames', () => {
  it('returns only titles with an earned platinum', () => {
    expect(platinumGames(dad).map((g) => g.name).sort()).toEqual([
      'God of War Ragnarök',
      'Rocket League®',
    ]);
    expect(platinumGames(braidan).map((g) => g.name)).toEqual(['Astro Bot']);
  });

  it('returns empty for an empty snapshot', () => {
    expect(platinumGames(empty)).toEqual([]);
  });
});

describe('playerTotals', () => {
  it('aggregates the headline totals from a snapshot', () => {
    const totals = playerTotals(dad);
    expect(totals.gamesPlayed).toBe(4); // four played titles
    expect(totals.trophiesTotal).toBe(150); // 43 + 41 + 66 earned
    expect(totals.platinums).toBe(2); // God of War + Rocket League
  });

  it('returns zeros for an empty snapshot', () => {
    const totals = playerTotals(empty);
    expect(totals).toMatchObject({
      playtimeMinutes: 0,
      gamesPlayed: 0,
      trophiesTotal: 0,
      platinums: 0,
      trophies: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
    });
  });
});

describe('comparePlayers', () => {
  const comparison = comparePlayers(dad, braidan);

  it('computes totals for both players', () => {
    expect(comparison.totals.a.platinums).toBe(2);
    expect(comparison.totals.b.platinums).toBe(1);
    expect(comparison.totals.a.gamesPlayed).toBe(4);
    expect(comparison.totals.b.gamesPlayed).toBe(4);
  });

  it('declares a per-metric winner in a UI-renderable shape', () => {
    const platinum = comparison.metrics.find((m) => m.metric === 'platinums')!;
    expect(platinum).toMatchObject({ a: 2, b: 1, winner: 'a' });
    expect(platinum.label).toMatch(/platinum/i);

    const playtime = comparison.metrics.find((m) => m.metric === 'playtimeMinutes')!;
    expect(playtime.winner).toBe('b'); // Braidan's Rocket League + Fortnite hours win
  });

  it('marks ties explicitly', () => {
    const games = comparison.metrics.find((m) => m.metric === 'gamesPlayed')!;
    expect(games.winner).toBe('tie');
  });

  it('finds shared games across platform naming differences', () => {
    const names = comparison.sharedGames.map((g) => g.name).sort();
    expect(names).toEqual(['God of War Ragnarök', 'Rocket League®']);
    const rocketLeague = comparison.sharedGames.find((g) => g.name === 'Rocket League®')!;
    expect(rocketLeague.b.playtimeMinutes).toBeGreaterThan(rocketLeague.a.playtimeMinutes);
  });

  it('handles an empty opponent without dividing by zero or crashing', () => {
    const vsEmpty = comparePlayers(dad, empty);
    expect(vsEmpty.sharedGames).toEqual([]);
    expect(vsEmpty.metrics.find((m) => m.metric === 'trophiesTotal')!.winner).toBe('a');
  });
});
