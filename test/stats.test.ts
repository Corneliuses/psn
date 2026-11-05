import { describe, expect, it } from 'vitest';

import { sampleSnapshot } from '../src/fixtures/sample.js';
import type { PlayerSnapshot, TrophyCounts } from '../src/psn/models.js';
import { totalTrophies } from '../src/psn/models.js';
import {
  comparePlayers,
  compareRoster,
  completionScoreboard,
  gamesWithMostTrophies,
  mostPlayedGames,
  platinumGames,
  playerTotals,
  playtimeTrend,
  recentGames,
  sharedGamesDeepDive,
  titleStats,
  trophyPace,
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

describe('compareRoster', () => {
  // A third player built from Dad's library: plays Rocket League (as the PS5
  // spelling, to exercise nameKey matching) and God of War, nothing else.
  const nadia: PlayerSnapshot = {
    ...empty,
    player: { key: 'nadia', displayName: 'Nadia' },
    playedTitles: [
      { ...dad.playedTitles.find((t) => t.name === 'Rocket League®')!, name: 'Rocket League', playDurationMinutes: 20 },
      { ...dad.playedTitles.find((t) => t.name === 'God of War Ragnarök')!, playDurationMinutes: 5000 },
    ],
    trophyTitles: [
      { ...dad.trophyTitles.find((t) => t.name === 'Rocket League®')!, name: 'Rocket League', earnedTotal: 3 },
    ],
  };
  const roster = compareRoster([dad, braidan, nadia]);
  const metricOf = (r: typeof roster, key: string) => r.metrics.find((m) => m.metric === key)!;

  it('keeps players and totals index-aligned in input (config) order', () => {
    expect(roster.players.map((p) => p.key)).toEqual(['dad', 'braidan', 'nadia']);
    expect(roster.totals.map((t) => t.gamesPlayed)).toEqual([4, 4, 2]);
    expect(roster.totals[0]).toEqual(playerTotals(dad));
  });

  it('uses the same metric set and labels as comparePlayers', () => {
    const pairwise = comparePlayers(dad, braidan);
    expect(roster.metrics.map((m) => [m.metric, m.label])).toEqual(
      pairwise.metrics.map((m) => [m.metric, m.label]),
    );
  });

  it('lists every player value and the leader for each metric', () => {
    const platinums = metricOf(roster, 'platinums');
    expect(platinums.values).toEqual([
      { playerKey: 'dad', value: 2 },
      { playerKey: 'braidan', value: 1 },
      { playerKey: 'nadia', value: 1 },
    ]);
    expect(platinums.leaders).toEqual(['dad']);
    expect(metricOf(roster, 'playtimeMinutes').leaders).toEqual(['braidan']);
  });

  it('lists every tied player as a leader', () => {
    // Dad and Braidan both played 4 games; Nadia played 2.
    expect(metricOf(roster, 'gamesPlayed').leaders).toEqual(['dad', 'braidan']);
    // Shared-games count is the same for everyone: a full tie.
    expect(metricOf(roster, 'sharedGames').leaders).toEqual(['dad', 'braidan', 'nadia']);
  });

  it('finds games every player has played, matched by nameKey, busiest first', () => {
    // Combined playtime: Rocket League 5800 + 18072 + 20 > God of War 4934 + 722 + 5000.
    expect(roster.sharedGames.map((g) => g.name)).toEqual(['Rocket League®', 'God of War Ragnarök']);
    const rocket = roster.sharedGames[0]!;
    expect(rocket.players.map((p) => p.playerKey)).toEqual(['dad', 'braidan', 'nadia']);
    expect(rocket.players[2]).toEqual({ playerKey: 'nadia', playtimeMinutes: 20, trophiesEarned: 3 });
    const gow = roster.sharedGames[1]!;
    expect(gow.players[2]!.trophiesEarned).toBe(0); // no trophy title → 0
    expect(metricOf(roster, 'sharedGames').values.map((v) => v.value)).toEqual([2, 2, 2]);
  });

  it('degenerates to the comparePlayers result for two players', () => {
    const two = compareRoster([dad, braidan]);
    const pairwise = comparePlayers(dad, braidan);
    expect(two.sharedGames.map((g) => g.name)).toEqual(pairwise.sharedGames.map((g) => g.name));
    for (const m of pairwise.metrics) {
      const r = metricOf(two, m.metric);
      expect(r.values.map((v) => v.value)).toEqual([m.a, m.b]);
      const expected = m.winner === 'tie' ? ['dad', 'braidan'] : m.winner === 'a' ? ['dad'] : ['braidan'];
      expect(r.leaders).toEqual(expected);
    }
  });

  it('matches comparePlayers when the first player has PS4 + PS5 entries of one game', () => {
    const rocket = dad.playedTitles.find((t) => t.name === 'Rocket League®')!;
    const rocketTrophies = dad.trophyTitles.find((t) => t.name === 'Rocket League®')!;
    const twoVersions: PlayerSnapshot = {
      ...dad,
      playedTitles: [...dad.playedTitles, { ...rocket, name: 'Rocket League', playDurationMinutes: 7 }],
      trophyTitles: [...dad.trophyTitles, { ...rocketTrophies, name: 'Rocket League', earnedTotal: 1 }],
    };
    const two = compareRoster([twoVersions, braidan]);
    const pairwise = comparePlayers(twoVersions, braidan);
    expect(two.sharedGames.map((g) => [g.name, g.players[0]!.playtimeMinutes, g.players[0]!.trophiesEarned])).toEqual(
      pairwise.sharedGames.map((g) => [g.name, g.a.playtimeMinutes, g.a.trophiesEarned]),
    );
  });

  it('handles an empty snapshot in the roster without crashing', () => {
    const withEmpty = compareRoster([dad, braidan, empty]);
    expect(withEmpty.sharedGames).toEqual([]);
    expect(metricOf(withEmpty, 'trophiesTotal').values[2]).toEqual({ playerKey: 'nobody', value: 0 });
    expect(metricOf(withEmpty, 'trophiesTotal').leaders).toEqual(['dad']);
  });

  it('treats an all-empty roster as a full tie at zero', () => {
    const blank = compareRoster([empty, { ...empty, player: { key: 'other', displayName: 'Other' } }]);
    for (const m of blank.metrics) {
      expect(m.values.every((v) => v.value === 0)).toBe(true);
      expect(m.leaders).toEqual(['nobody', 'other']);
    }
  });

  it('returns no shared games when no title is common to everyone', () => {
    const loner: PlayerSnapshot = {
      ...empty,
      player: { key: 'loner', displayName: 'Loner' },
      playedTitles: [{ ...dad.playedTitles.find((t) => t.name === 'Elden Ring')! }],
    };
    const none = compareRoster([dad, braidan, loner]);
    expect(none.sharedGames).toEqual([]);
    expect(metricOf(none, 'sharedGames').values.map((v) => v.value)).toEqual([0, 0, 0]);
  });

  it('returns an empty comparison for an empty roster', () => {
    expect(compareRoster([])).toEqual({ players: [], totals: [], metrics: expect.any(Array), sharedGames: [] });
    expect(compareRoster([]).metrics.every((m) => m.values.length === 0 && m.leaders.length === 0)).toBe(true);
  });
});

// Build a snapshot with given playtime + captured time from the dad fixture's
// first played title, so trend tests read from a known shape.
function playtimeSnapshot(capturedAt: string, playtimeMinutes: number): PlayerSnapshot {
  return {
    ...empty,
    capturedAt,
    playedTitles: [{ ...dad.playedTitles[0]!, playDurationMinutes: playtimeMinutes }],
  };
}

// A snapshot whose single trophy title has exactly the given earned tiers.
function trophySnapshot(capturedAt: string, earned: TrophyCounts): PlayerSnapshot {
  return {
    ...empty,
    capturedAt,
    trophyTitles: [{ ...dad.trophyTitles[0]!, earned, earnedTotal: totalTrophies(earned) }],
  };
}

describe('playtimeTrend', () => {
  it('returns total playtime per snapshot, oldest → newest', () => {
    const trend = playtimeTrend([
      playtimeSnapshot('2026-07-13T00:00:00.000Z', 100),
      playtimeSnapshot('2026-07-15T00:00:00.000Z', 250),
    ]);
    expect(trend).toEqual([
      { capturedAt: '2026-07-13T00:00:00.000Z', playtimeMinutes: 100 },
      { capturedAt: '2026-07-15T00:00:00.000Z', playtimeMinutes: 250 },
    ]);
  });

  it('yields a single point for one snapshot (a normal pre-history state)', () => {
    const trend = playtimeTrend([playtimeSnapshot('2026-07-15T00:00:00.000Z', 100)]);
    expect(trend).toEqual([{ capturedAt: '2026-07-15T00:00:00.000Z', playtimeMinutes: 100 }]);
  });

  it('returns empty for no snapshots', () => {
    expect(playtimeTrend([])).toEqual([]);
  });
});

describe('trophyPace', () => {
  it('reports trophies earned between consecutive snapshots, by tier', () => {
    const pace = trophyPace([
      trophySnapshot('2026-07-13T00:00:00.000Z', { bronze: 5, silver: 2, gold: 1, platinum: 0 }),
      trophySnapshot('2026-07-15T00:00:00.000Z', { bronze: 8, silver: 2, gold: 1, platinum: 1 }),
    ]);
    expect(pace).toEqual([
      {
        from: '2026-07-13T00:00:00.000Z',
        to: '2026-07-15T00:00:00.000Z',
        earned: { bronze: 3, silver: 0, gold: 0, platinum: 1 },
        total: 4,
      },
    ]);
  });

  it('produces one interval per consecutive pair', () => {
    const pace = trophyPace([
      trophySnapshot('2026-07-13T00:00:00.000Z', { bronze: 1, silver: 0, gold: 0, platinum: 0 }),
      trophySnapshot('2026-07-14T00:00:00.000Z', { bronze: 3, silver: 0, gold: 0, platinum: 0 }),
      trophySnapshot('2026-07-15T00:00:00.000Z', { bronze: 6, silver: 0, gold: 0, platinum: 0 }),
    ]);
    expect(pace.map((p) => p.total)).toEqual([2, 3]);
  });

  it('clamps a negative delta (dropped title) to zero', () => {
    const pace = trophyPace([
      trophySnapshot('2026-07-13T00:00:00.000Z', { bronze: 5, silver: 0, gold: 0, platinum: 0 }),
      trophySnapshot('2026-07-15T00:00:00.000Z', { bronze: 2, silver: 0, gold: 0, platinum: 0 }),
    ]);
    expect(pace[0]!.earned.bronze).toBe(0);
    expect(pace[0]!.total).toBe(0);
  });

  it('returns empty for fewer than two snapshots', () => {
    expect(trophyPace([])).toEqual([]);
    expect(trophyPace([trophySnapshot('2026-07-15T00:00:00.000Z', { bronze: 1, silver: 0, gold: 0, platinum: 0 })])).toEqual([]);
  });
});

describe('completionScoreboard', () => {
  it('lists near-platinum titles (progress >= 90, no platinum), closest first', () => {
    const snapshot: PlayerSnapshot = {
      ...empty,
      trophyTitles: [
        { ...dad.trophyTitles[0]!, name: 'Almost', progress: 95, hasPlatinum: false },
        { ...dad.trophyTitles[0]!, name: 'Closer', progress: 99, hasPlatinum: false },
        { ...dad.trophyTitles[0]!, name: 'Done', progress: 100, hasPlatinum: true },
        { ...dad.trophyTitles[0]!, name: 'Midway', progress: 50, hasPlatinum: false },
      ],
    };
    expect(completionScoreboard(snapshot).nearPlatinum.map((t) => t.name)).toEqual([
      'Closer',
      'Almost',
    ]);
  });

  it('counts the untouched backlog (no trophy title or nothing earned)', () => {
    // Dad has 4 played titles; only Gran Turismo 7 has no trophy title.
    expect(completionScoreboard(dad).untouchedBacklog).toBe(1);
  });

  it('counts a played title as touched when any trophy variant has earned trophies', () => {
    // Separate PS4/PS5 trophy sets normalize to the same name; one is untouched,
    // the other has earned trophies. The played title must count as touched.
    const snapshot: PlayerSnapshot = {
      ...empty,
      playedTitles: [{ ...dad.playedTitles[0]!, name: 'Rocket League®' }],
      trophyTitles: [
        {
          ...dad.trophyTitles[0]!,
          name: 'Rocket League',
          earned: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
          earnedTotal: 0,
        },
        {
          ...dad.trophyTitles[0]!,
          name: 'Rocket League®',
          earned: { bronze: 5, silver: 0, gold: 0, platinum: 0 },
          earnedTotal: 5,
        },
      ],
    };
    expect(completionScoreboard(snapshot).untouchedBacklog).toBe(0);
  });

  it('counts a played title with a zero-earned trophy title as untouched', () => {
    const snapshot: PlayerSnapshot = {
      ...empty,
      playedTitles: [{ ...dad.playedTitles[0]!, name: 'Shelved' }],
      trophyTitles: [
        {
          ...dad.trophyTitles[0]!,
          name: 'Shelved',
          earned: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
          earnedTotal: 0,
        },
      ],
    };
    expect(completionScoreboard(snapshot).untouchedBacklog).toBe(1);
  });

  it('averages progress across trophy titles', () => {
    expect(completionScoreboard(dad).averageProgress).toBeCloseTo((89 + 78 + 100) / 3);
  });

  it('returns a zero average for a snapshot with no trophy titles', () => {
    expect(completionScoreboard(empty).averageProgress).toBe(0);
    expect(completionScoreboard(empty).nearPlatinum).toEqual([]);
  });
});

describe('sharedGamesDeepDive', () => {
  const deepDive = sharedGamesDeepDive(dad, braidan);

  it('covers the same shared games as comparePlayers, busiest first', () => {
    expect(deepDive.map((g) => g.name)).toEqual(['Rocket League®', 'God of War Ragnarök']);
  });

  it('reports playtime gap, trophy gap, and per-metric leaders', () => {
    const rocket = deepDive.find((g) => g.name === 'Rocket League®')!;
    expect(rocket.playtimeGap).toBe(Math.abs(rocket.a.playtimeMinutes - rocket.b.playtimeMinutes));
    expect(rocket.trophyGap).toBe(Math.abs(rocket.a.trophiesEarned - rocket.b.trophiesEarned));
    // Braidan sank far more hours into Rocket League; Dad earned its platinum set.
    expect(rocket.playtimeLeader).toBe('b');
    expect(rocket.trophyLeader).toBe('a');
  });

  it('flags who played each shared game more recently', () => {
    // Dad last played God of War 2026-07-10; Braidan 2026-04-11.
    const gow = deepDive.find((g) => g.name === 'God of War Ragnarök')!;
    expect(gow.recentlyPlayedBy).toBe('a');
  });

  it('returns empty against an opponent with no shared games', () => {
    expect(sharedGamesDeepDive(dad, empty)).toEqual([]);
  });
});

describe('titleStats', () => {
  it('rolls a single title up from played and trophy data', () => {
    const stats = titleStats(dad, ['Elden Ring']);
    expect(stats).toMatchObject({
      name: 'Elden Ring',
      playtimeMinutes: 12604,
      trophiesEarned: 41,
      trophiesDefined: 45,
      progress: 78,
      hasPlatinum: false,
    });
  });

  it('matches every alias a title goes by, ignoring case and trademark symbols', () => {
    const byExactName = titleStats(dad, ['Rocket League®']);
    const byAlias = titleStats(dad, ['rocket league']);
    expect(byAlias).toEqual(byExactName);
    expect(byAlias?.hasPlatinum).toBe(true);
  });

  it('sums playtime, play counts and trophies across duplicate entries for one game', () => {
    const twice: PlayerSnapshot = {
      ...empty,
      playedTitles: [
        {
          titleId: 'PPSA00001_00',
          name: 'Grounded 2',
          imageUrl: '',
          category: 'ps5_native_game',
          playCount: 10,
          playDurationIso: 'PT2H',
          playDurationMinutes: 120,
          firstPlayed: '2026-08-11T00:00:00Z',
          lastPlayed: '2026-09-11T00:00:00Z',
        },
        {
          titleId: 'PPSA00002_00',
          name: 'Grounded 2',
          imageUrl: '',
          category: 'ps5_native_game',
          playCount: 1,
          playDurationIso: 'PT1H',
          playDurationMinutes: 60,
          firstPlayed: '2026-08-01T00:00:00Z',
          lastPlayed: '2026-08-20T00:00:00Z',
        },
      ],
    };

    expect(titleStats(twice, ['Grounded 2'])).toMatchObject({
      playtimeMinutes: 180,
      playCount: 11,
      firstPlayed: '2026-08-01T00:00:00Z',
      lastPlayed: '2026-09-11T00:00:00Z',
    });
  });

  it('takes the highest progress across separate trophy stacks for one game', () => {
    const crossGen: PlayerSnapshot = {
      ...empty,
      trophyTitles: [
        {
          npCommunicationId: 'NPWR00001_00',
          name: 'Grounded',
          platform: 'PS4',
          iconUrl: '',
          defined: { bronze: 2, silver: 0, gold: 0, platinum: 0 },
          earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 },
          earnedTotal: 1,
          progress: 40,
          hasPlatinum: false,
          lastTrophyAt: '2026-01-01T00:00:00Z',
        },
        {
          npCommunicationId: 'NPWR00002_00',
          name: 'Grounded',
          platform: 'PS5',
          iconUrl: '',
          defined: { bronze: 2, silver: 1, gold: 0, platinum: 0 },
          earned: { bronze: 2, silver: 1, gold: 0, platinum: 0 },
          earnedTotal: 3,
          progress: 90,
          hasPlatinum: false,
          lastTrophyAt: '2026-02-01T00:00:00Z',
        },
      ],
    };

    expect(titleStats(crossGen, ['Grounded'])).toMatchObject({
      playtimeMinutes: 0,
      trophiesEarned: 4,
      trophiesDefined: 5,
      progress: 90,
    });
  });

  it('keeps the shared progress when two trophy stacks are tied', () => {
    const tied: PlayerSnapshot = {
      ...empty,
      trophyTitles: [
        {
          npCommunicationId: 'NPWR00003_00',
          name: 'Grounded',
          platform: 'PS4',
          iconUrl: '',
          defined: { bronze: 2, silver: 0, gold: 0, platinum: 0 },
          earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 },
          earnedTotal: 1,
          progress: 50,
          hasPlatinum: false,
          lastTrophyAt: '2026-01-01T00:00:00Z',
        },
        {
          npCommunicationId: 'NPWR00004_00',
          name: 'Grounded',
          platform: 'PS5',
          iconUrl: '',
          defined: { bronze: 2, silver: 0, gold: 0, platinum: 0 },
          earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 },
          earnedTotal: 1,
          progress: 50,
          hasPlatinum: false,
          lastTrophyAt: '2026-02-01T00:00:00Z',
        },
      ],
    };

    // Equal progress resolves to that value, while the counts still sum.
    expect(titleStats(tied, ['Grounded'])).toMatchObject({
      progress: 50,
      trophiesEarned: 2,
      trophiesDefined: 4,
    });
  });

  it('returns undefined when the player has neither played nor earned a trophy in the title', () => {
    expect(titleStats(dad, ['A Game Nobody Here Owns'])).toBeUndefined();
    expect(titleStats(empty, ['Elden Ring'])).toBeUndefined();
  });
});
