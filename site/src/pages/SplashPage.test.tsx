import { render, screen, within } from '@testing-library/react';
import { sampleSnapshot } from 'psn';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { players } from '../config/players';
import { snapshotByKey } from '../data';
import { SplashPage } from './SplashPage';

vi.mock('../data');
const snapshotByKeyMock = vi.mocked(snapshotByKey);

// Dad and Braidan have synced snapshots; Nadia has none yet, so her portal
// renders without numbers — both branches of the portal card on one page.
beforeEach(() => {
  snapshotByKeyMock.mockImplementation((key) =>
    key === 'nadia' ? undefined : sampleSnapshot(key, key === 'dad' ? 'Dad' : 'Braidan'),
  );
});

// Pin a three-player family roster so the list formatting, three-card grid, and
// face-off CTA are exercised independently of what psn.config.json holds today.
vi.mock('../config/players', () => ({
  players: [
    { key: 'dad', displayName: 'Dad' },
    { key: 'braidan', displayName: 'Braidan' },
    { key: 'nadia', displayName: 'Nadia' },
  ],
}));

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

    expect(screen.getByRole('img', { name: /controller/i })).toBeInTheDocument();
  });

  it('renders a level-1 heading naming every configured player', () => {
    renderSplash();

    const heading = screen.getByRole('heading', { level: 1 });
    for (const player of players) {
      expect(heading).toHaveTextContent(player.displayName);
    }
    expect(heading).toHaveTextContent('PlayStation Stats');
  });

  it('formats three names as a natural list in the heading’s accessible name', () => {
    renderSplash();

    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Dad, Braidan & Nadia’s PlayStation Stats',
    );
  });

  it('renders one portal card per player in the grid', () => {
    renderSplash();

    const portalList = screen.getAllByRole('list')[0]!;
    expect(within(portalList).getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows each synced player’s totals on their portal and a no-stats line otherwise', () => {
    renderSplash();

    const dadTotals = sampleSnapshot('dad', 'Dad');
    const dad = screen.getByRole('link', { name: /Dad/ });
    expect(within(dad).getByText(String(dadTotals.playedTitles.length))).toBeInTheDocument();
    expect(within(dad).getAllByRole('img', { name: /troph/ })).toHaveLength(4);

    const nadia = screen.getByRole('link', { name: /Nadia/ });
    expect(within(nadia).getByText('No stats synced yet')).toBeInTheDocument();
    expect(within(nadia).queryByRole('img')).not.toBeInTheDocument();
  });

  it('leads with the big help-desk call to action linking to /help', () => {
    renderSplash();

    const help = screen.getByRole('link', { name: 'Get help with your game' });
    expect(help).toHaveAttribute('href', '/help');
    // It is the first link on the page.
    expect(screen.getAllByRole('link')[0]).toBe(help);
  });

  it('names every player in the face-off CTA while keeping its accessible name "Compare"', () => {
    renderSplash();

    const cta = screen.getByRole('link', { name: 'Compare' });
    for (const name of ['Dad', 'Braidan', 'Nadia']) {
      expect(cta).toHaveTextContent(name);
    }
    // One VS pill between each adjacent pair of players.
    expect(within(cta).getAllByText('VS')).toHaveLength(2);
  });
});
