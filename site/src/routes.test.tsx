import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';

import { App } from './App';
import { companions } from './companions';
import { players } from './config/players';
import {
  COMPARE_PATH,
  DISCOVER_PATH,
  HELP_PATH,
  TOGETHER_PATH,
  companionPath,
  comparePath,
  helpPath,
  playerPairings,
  playerPath,
} from './routes';

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

  it('renders the compare hub at /compare', () => {
    render(
      <MemoryRouter initialEntries={[COMPARE_PATH]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Compare' })).toBeInTheDocument();
  });

  it.each(playerPairings)('renders the pairwise compare page for $a.key vs $b.key', ({ a, b }) => {
    render(
      <MemoryRouter initialEntries={[comparePath(a.key, b.key)]}>
        <App />
      </MemoryRouter>,
    );
    // Match the exact accessible name as a string so a display name with regex
    // metacharacters can't skew it.
    expect(
      screen.getByRole('heading', { level: 1, name: `${a.displayName} versus ${b.displayName}` }),
    ).toBeInTheDocument();
  });

  it('renders the discover page at /discover', () => {
    render(
      <MemoryRouter initialEntries={[DISCOVER_PATH]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Discover' })).toBeInTheDocument();
  });

  it('renders the together page at /together', () => {
    render(
      <MemoryRouter initialEntries={[TOGETHER_PATH]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Together' })).toBeInTheDocument();
  });

  it('renders the help desk at /help', () => {
    render(
      <MemoryRouter initialEntries={[HELP_PATH]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Help desk' })).toBeInTheDocument();
  });

  it('renders a companion app at /together/:slug', () => {
    const [first] = companions;
    expect(first).toBeDefined();
    render(
      <MemoryRouter initialEntries={[companionPath(first!.slug)]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: first!.name })).toBeInTheDocument();
  });

  it.each(['/compare/dad/dad', '/compare/dad/nobody', '/compare/dad'])(
    'renders the not-found page for the invalid matchup %s',
    (path) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>,
      );
      expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    },
  );

  it('renders a not-found page for an unmatched route', () => {
    render(
      <MemoryRouter initialEntries={['/this-path-does-not-exist']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});

describe('comparePath', () => {
  it('builds /compare/:a/:b', () => {
    expect(comparePath('dad', 'braidan')).toBe('/compare/dad/braidan');
  });
});

describe('helpPath', () => {
  it('builds /help, with the game query-encoded when given', () => {
    expect(helpPath()).toBe('/help');
    expect(helpPath('Grounded 2')).toBe('/help?game=Grounded+2');
    expect(helpPath('LEGO Batman: Legacy & more')).toBe('/help?game=LEGO+Batman%3A+Legacy+%26+more');
  });
});

describe('playerPairings', () => {
  it('has one pairing per 2-combination of players', () => {
    expect(playerPairings).toHaveLength((players.length * (players.length - 1)) / 2);
  });

  it('puts the earlier player in config order on the left of every pairing', () => {
    const order = players.map((player) => player.key);
    for (const { a, b } of playerPairings) {
      expect(order.indexOf(a.key)).toBeLessThan(order.indexOf(b.key));
    }
  });

  it('never pairs a player with themselves or repeats a matchup', () => {
    const seen = new Set<string>();
    for (const { a, b } of playerPairings) {
      expect(a.key).not.toBe(b.key);
      const id = [a.key, b.key].sort().join('|');
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
  });
});
