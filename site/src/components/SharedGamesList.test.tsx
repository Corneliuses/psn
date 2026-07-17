import { render, screen } from '@testing-library/react';
import type { SharedGame } from 'psn';
import { describe, expect, it } from 'vitest';

import { SharedGamesList } from './SharedGamesList';
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

const games: SharedGame[] = [
  {
    name: 'Rocket League®',
    a: { playtimeMinutes: 5800, trophiesEarned: 66 },
    b: { playtimeMinutes: 18072, trophiesEarned: 47 },
  },
];

function renderList(sharedGames: SharedGame[]) {
  return render(
    <SharedGamesList
      sharedGames={sharedGames}
      nameA="Dad"
      nameB="Braidan"
      accentA={accentA}
      accentB={accentB}
    />,
  );
}

describe('SharedGamesList', () => {
  it('renders a row per shared game with each player’s playtime and trophies', () => {
    renderList(games);

    expect(screen.getByText('Rocket League®')).toBeInTheDocument();
    // Playtimes formatted via formatMinutes.
    expect(screen.getByText('96h 40m')).toBeInTheDocument();
    expect(screen.getByText('301h 12m')).toBeInTheDocument();
    // Trophies earned per player.
    expect(screen.getByText('66 trophies')).toBeInTheDocument();
    expect(screen.getByText('47 trophies')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('renders a styled empty state when there are no shared games', () => {
    renderList([]);

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByText(/no shared games yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Dad and Braidan/)).toBeInTheDocument();
  });
});
