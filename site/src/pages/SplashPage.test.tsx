import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';

import { players } from '../config/players';
import { SplashPage } from './SplashPage';

/** Escape regex metacharacters so display names with e.g. `(`, `+`, `?` match literally. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderSplash() {
  return render(
    <MemoryRouter>
      <SplashPage />
    </MemoryRouter>,
  );
}

describe('SplashPage', () => {
  it('renders exactly one portal link for every configured player plus Compare', () => {
    renderSplash();

    for (const player of players) {
      const links = screen.getAllByRole('link', { name: new RegExp(escapeRegExp(player.displayName)) });
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute('href', `/${player.key}`);
    }

    expect(screen.getByRole('link', { name: 'Compare' })).toHaveAttribute('href', '/compare');
  });

  it('renders the hero illustration with an accessible name', () => {
    renderSplash();

    expect(screen.getByRole('img')).toHaveAccessibleName(/controller/i);
  });

  it('renders a level-1 heading naming every configured player', () => {
    renderSplash();

    const heading = screen.getByRole('heading', { level: 1 });
    for (const player of players) {
      expect(heading).toHaveTextContent(player.displayName);
    }
    expect(heading).toHaveTextContent('PlayStation Stats');
  });
});
