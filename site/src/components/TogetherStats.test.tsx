import { render, screen } from '@testing-library/react';
import type { TitleStats } from 'psn/stats';
import { describe, expect, it } from 'vitest';

import { TogetherStats, type TogetherStatsEntry } from './TogetherStats';
import { accentForKey } from '../config/accents';

function entry(key: string, name: string, stats: TitleStats | undefined): TogetherStatsEntry {
  return { playerKey: key, displayName: name, accent: accentForKey(key), stats };
}

const dadStats: TitleStats = {
  name: 'Grounded 2',
  playtimeMinutes: 120,
  playCount: 10,
  trophiesEarned: 4,
  trophiesDefined: 20,
  progress: 20,
  hasPlatinum: false,
  firstPlayed: '2026-08-01T00:00:00Z',
  lastPlayed: '2026-09-11T00:00:00Z',
};

describe('TogetherStats', () => {
  it('shows combined totals and a card per player', () => {
    render(
      <TogetherStats
        entries={[
          entry('dad', 'Dad', dadStats),
          entry('braidan', 'Braidan', {
            ...dadStats,
            playtimeMinutes: 60,
            trophiesEarned: 2,
            lastPlayed: '2026-09-09T00:00:00Z',
          }),
        ]}
      />,
    );

    // AnimatedNumber settles immediately in jsdom, so assert the final values.
    expect(screen.getByText('3h 0m')).toBeInTheDocument();
    expect(screen.getByText('Combined playtime')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Dad/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Braidan/ })).toBeInTheDocument();
    expect(screen.getByText('4 of 20')).toBeInTheDocument();
    expect(screen.getByText('Sep 11, 2026')).toBeInTheDocument();
    expect(screen.getByText('Sep 9, 2026')).toBeInTheDocument();
  });

  it('marks a player who has never launched the title instead of showing zeroes', () => {
    render(<TogetherStats entries={[entry('dad', 'Dad', dadStats), entry('braidan', 'Braidan', undefined)]} />);

    expect(screen.getByText(/not in this library yet/i)).toBeInTheDocument();
  });

  it('renders an empty state when neither player has played the title', () => {
    render(
      <TogetherStats entries={[entry('dad', 'Dad', undefined), entry('braidan', 'Braidan', undefined)]} />,
    );

    expect(screen.getByText(/neither of us has played this yet/i)).toBeInTheDocument();
  });
});
