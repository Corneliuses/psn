import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';

import { App } from './App';
import { players } from './config/players';
import { COMPARE_PATH, playerPath } from './routes';

describe('routing', () => {
  it('renders the splash page at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /PlayStation Stats/ })).toBeInTheDocument();
  });

  it.each(players)('renders a player page at $key', (player) => {
    render(
      <MemoryRouter initialEntries={[playerPath(player.key)]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: new RegExp(player.displayName) })).toBeInTheDocument();
  });

  it('renders the compare page at /compare', () => {
    render(
      <MemoryRouter initialEntries={[COMPARE_PATH]}>
        <App />
      </MemoryRouter>,
    );
    // The compare page leads with the VS hero matchup heading (players in config order).
    const [a, b] = players;
    expect(
      screen.getByRole('heading', { name: new RegExp(`${a!.displayName} versus ${b!.displayName}`, 'i') }),
    ).toBeInTheDocument();
  });

  it('renders a not-found page for an unmatched route', () => {
    render(
      <MemoryRouter initialEntries={['/this-path-does-not-exist']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
