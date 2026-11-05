import { render, screen, within } from '@testing-library/react';
import type { RosterComparison, RosterMetric } from 'psn/stats';
import { describe, expect, it } from 'vitest';

import { FamilyScoreboard } from './FamilyScoreboard';

const KEYS = ['dad', 'braidan', 'nadia'] as const;

function metric(key: string, label: string, values: [number, number, number]): RosterMetric {
  const max = Math.max(...values);
  return {
    metric: key,
    label,
    values: values.map((value, i) => ({ playerKey: KEYS[i]!, value })),
    leaders: KEYS.filter((_, i) => values[i] === max),
  };
}

function roster(overrides: Partial<RosterComparison> = {}): RosterComparison {
  return {
    players: [
      { key: 'dad', displayName: 'Dad' },
      { key: 'braidan', displayName: 'Braidan' },
      { key: 'nadia', displayName: 'Nadia' },
    ],
    totals: [],
    metrics: [
      metric('playtimeMinutes', 'Total playtime', [600, 125, 59]),
      metric('gamesPlayed', 'Games played', [5, 9, 9]),
      metric('trophiesTotal', 'Total trophies', [40, 30, 20]),
      metric('bronze', 'Bronze', [20, 10, 5]),
      metric('silver', 'Silver', [10, 10, 10]),
      metric('gold', 'Gold', [8, 9, 4]),
      metric('platinums', 'Platinums', [0, 0, 0]),
      metric('sharedGames', 'Shared games', [1, 1, 1]),
    ],
    sharedGames: [
      {
        name: 'Minecraft',
        players: [
          { playerKey: 'dad', playtimeMinutes: 90, trophiesEarned: 1 },
          { playerKey: 'braidan', playtimeMinutes: 300, trophiesEarned: 12 },
          { playerKey: 'nadia', playtimeMinutes: 45, trophiesEarned: 0 },
        ],
      },
    ],
    ...overrides,
  };
}

describe('FamilyScoreboard', () => {
  it('renders one three-way meter per headline metric with formatted playtime', () => {
    render(<FamilyScoreboard roster={roster()} />);

    expect(screen.getByRole('heading', { name: 'Family scoreboard' })).toBeInTheDocument();
    const playtime = screen.getByRole('list', { name: 'Total playtime' });
    expect(within(playtime).getAllByRole('listitem')).toHaveLength(3);
    expect(within(playtime).getByText('10h 0m')).toBeInTheDocument();
    expect(within(playtime).getByText('2h 5m')).toBeInTheDocument();
    for (const label of ['Games played', 'Total trophies', 'Shared games']) {
      expect(screen.getByRole('list', { name: label })).toBeInTheDocument();
    }
  });

  it('marks the leaders from the data, including partial ties', () => {
    render(<FamilyScoreboard roster={roster()} />);

    const games = screen.getByRole('list', { name: 'Games played' });
    const leaders = within(games)
      .getAllByRole('listitem')
      .filter((li) => li.dataset.leader === 'true')
      .map((li) => li.dataset.player);
    expect(leaders).toEqual(['braidan', 'nadia']);
  });

  it('renders trophy tiers with the reserved metal text colors', () => {
    render(<FamilyScoreboard roster={roster()} />);

    expect(screen.getByRole('heading', { name: 'Family trophy tiers' })).toBeInTheDocument();
    expect(screen.getByText('Gold').parentElement).toHaveClass('text-trophy-gold');
    expect(screen.getByText('Platinums').parentElement).toHaveClass('text-trophy-platinum');
  });

  it('lists games played by everyone with per-player playtime and trophies', () => {
    render(<FamilyScoreboard roster={roster()} />);

    expect(screen.getByRole('heading', { name: 'Played by everyone' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Played by everyone' });
    const [game] = within(list).getAllByRole('listitem');
    expect(within(game!).getByRole('heading', { name: 'Minecraft' })).toBeInTheDocument();
    expect(within(game!).getByText('5h 0m')).toBeInTheDocument();
    expect(within(game!).getByText('12 trophies')).toBeInTheDocument();
    expect(within(game!).getByText('1 trophy')).toBeInTheDocument();
    expect(within(game!).getByText('Nadia')).toBeInTheDocument();
  });

  it('shows an empty state when no game is shared by everyone', () => {
    render(<FamilyScoreboard roster={roster({ sharedGames: [] })} />);

    expect(screen.getByText('No game has been played by everyone yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Played by everyone' })).toBeNull();
  });
});
