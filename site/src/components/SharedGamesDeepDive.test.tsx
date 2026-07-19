import { render, screen } from '@testing-library/react';
import type { SharedGameDeepDive as SharedGameDeepDiveData } from 'psn/stats';
import { describe, expect, it } from 'vitest';

import { SharedGamesDeepDive } from './SharedGamesDeepDive';
import type { PlayerAccent } from '../config/accents';

const accentA: PlayerAccent = {
  glyph: '△',
  text: 'text-shape-triangle',
  fill: 'fill-shape-triangle',
  colorVar: 'var(--color-shape-triangle)',
};
const accentB: PlayerAccent = {
  glyph: '○',
  text: 'text-shape-circle',
  fill: 'fill-shape-circle',
  colorVar: 'var(--color-shape-circle)',
};

const games: SharedGameDeepDiveData[] = [
  {
    name: 'Rocket League®',
    a: { playtimeMinutes: 5800, trophiesEarned: 66, lastPlayed: '2026-07-14T19:12:00Z' },
    b: { playtimeMinutes: 18072, trophiesEarned: 47, lastPlayed: '2026-07-14T20:00:00Z' },
    playtimeGap: 12272,
    trophyGap: 19,
    playtimeLeader: 'b',
    trophyLeader: 'a',
    recentlyPlayedBy: 'b',
  },
];

function renderDeepDive(data: SharedGameDeepDiveData[]) {
  return render(
    <SharedGamesDeepDive
      games={data}
      nameA="Dad"
      nameB="Braidan"
      accentA={accentA}
      accentB={accentB}
    />,
  );
}

describe('SharedGamesDeepDive', () => {
  it('renders a row per shared game with playtimes, gaps, and recency', () => {
    renderDeepDive(games);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Rocket League®')).toBeInTheDocument();
    expect(screen.getByText('96h 40m')).toBeInTheDocument(); // Dad's playtime
    expect(screen.getByText('301h 12m')).toBeInTheDocument(); // Braidan's playtime
    // Gaps and recency winner.
    expect(screen.getByText(/Playtime gap:/)).toBeInTheDocument();
    expect(screen.getByText('204h 32m')).toBeInTheDocument(); // 12272-min gap
    expect(screen.getByText(/Trophy gap:/)).toBeInTheDocument();
    // Braidan played it more recently — assert on the recency line specifically,
    // since the name also appears as a player-column label.
    expect(screen.getByRole('listitem')).toHaveTextContent('Played more recently: Braidan');
  });

  it('renders a styled empty state when there are no shared games', () => {
    renderDeepDive([]);

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByText(/no shared games yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Dad and Braidan/)).toBeInTheDocument();
  });
});
