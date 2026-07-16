import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';

import { AppShell } from './AppShell';
import { players } from '../config/players';
import { playerPath } from '../routes';

function renderShell(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppShell>
        <main>
          <h1>Page content</h1>
        </main>
      </AppShell>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('renders its children', () => {
    renderShell('/');
    expect(screen.getByRole('heading', { name: 'Page content' })).toBeInTheDocument();
  });

  it('renders a nav link for every configured player plus Compare', () => {
    renderShell('/');

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    for (const player of players) {
      const link = screen.getByRole('link', { name: player.displayName });
      expect(nav).toContainElement(link);
      expect(link).toHaveAttribute('href', `/${player.key}`);
    }

    const compare = screen.getByRole('link', { name: 'Compare' });
    expect(nav).toContainElement(compare);
    expect(compare).toHaveAttribute('href', '/compare');
  });

  it('marks the active route link with aria-current', () => {
    const [first] = players;
    renderShell(playerPath(first!.key));

    const active = screen.getByRole('link', { name: first!.displayName });
    expect(active).toHaveAttribute('aria-current', 'page');

    // The home wordmark uses an exact match, so it is not active on a player route.
    const home = screen.getByRole('link', { name: 'PSN Stats home' });
    expect(home).not.toHaveAttribute('aria-current');
  });
});
