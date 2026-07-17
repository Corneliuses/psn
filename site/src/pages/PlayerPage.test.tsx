import { render, screen, within } from '@testing-library/react';
import { sampleSnapshot } from 'psn';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlayerPage } from './PlayerPage';
import { snapshotByKey } from '../data';

vi.mock('../data');

const snapshotByKeyMock = vi.mocked(snapshotByKey);

afterEach(() => {
  vi.resetAllMocks();
});

describe('PlayerPage', () => {
  it('renders the four stat sections for a player with a snapshot', () => {
    snapshotByKeyMock.mockReturnValue(sampleSnapshot('dad', 'Dad'));

    render(<PlayerPage playerKey="dad" />);

    expect(screen.getByRole('heading', { level: 1, name: /Dad/ })).toBeInTheDocument();
    for (const heading of ['Recent games', 'Most played', 'Most trophies', 'Platinum games']) {
      expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
    }

    // Most played → duration via formatMinutes (Elden Ring, longest play time).
    expect(screen.getByText('210h 4m')).toBeInTheDocument();
    // Most trophies → earned trophy count (Rocket League, most earned).
    expect(screen.getByText('66 trophies')).toBeInTheDocument();
    // Recent games → last-played date (Rocket League, most recent).
    expect(screen.getByText('Last played Jul 14, 2026')).toBeInTheDocument();
    // Platinum games → every game with a platinum (Rocket League + God of War),
    // now marked with a platinum TrophyBadge rather than the word "Platinum".
    expect(screen.getAllByRole('img', { name: /platinum trophy/i })).toHaveLength(2);
  });

  it('shows a summary row of stat tiles with final count-up values', () => {
    snapshotByKeyMock.mockReturnValue(sampleSnapshot('dad', 'Dad'));

    render(<PlayerPage playerKey="dad" />);

    // Each tile: the value and its label live in the same GlassCard, so scope
    // the numeric assertion to the tile to avoid colliding with other "2"/"4".
    const tileValue = (label: string): HTMLElement =>
      screen.getByText(label).closest('div') as HTMLElement;

    expect(within(tileValue('Games played')).getByText('4')).toBeInTheDocument();
    expect(within(tileValue('Total trophies')).getByText('150')).toBeInTheDocument();
    expect(within(tileValue('Platinums')).getByText('2')).toBeInTheDocument();
  });

  it('renders a friendly empty state when the player has no snapshot', () => {
    snapshotByKeyMock.mockReturnValue(undefined);

    render(<PlayerPage playerKey="dad" />);

    expect(screen.getByRole('heading', { level: 1, name: /Dad/ })).toBeInTheDocument();
    expect(screen.getByText(/no stats synced yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('renders a not-found state for an unknown key', () => {
    render(<PlayerPage playerKey="stranger" />);
    expect(screen.getByRole('heading', { name: /not found/i })).toBeInTheDocument();
  });
});
