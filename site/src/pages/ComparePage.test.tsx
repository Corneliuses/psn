import { render, screen } from '@testing-library/react';
import { sampleSnapshot } from 'psn';
import type { PlayerSnapshot } from 'psn';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ComparePage } from './ComparePage';
import { snapshotByKey } from '../data';

vi.mock('../data');

const snapshotByKeyMock = vi.mocked(snapshotByKey);

/** A player with no games — pairs with `dad` to force zero shared games. */
const emptySnapshot: PlayerSnapshot = {
  schemaVersion: 1,
  player: { key: 'braidan', displayName: 'Braidan' },
  capturedAt: '2026-07-15T00:00:00.000Z',
  playedTitles: [],
  trophyTitles: [],
};

/** Render the page at a URL through the same `/compare/:a/:b` pattern App uses. */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/compare/:a/:b" element={<ComparePage />} />
        <Route path="/compare/:a" element={<ComparePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

/** The clash-meter row whose label matches, so its winner indication can be read. */
function rowByLabel(label: string): HTMLElement {
  const row = screen.getByText(label).closest('[data-winner]');
  if (!(row instanceof HTMLElement)) {
    throw new Error(`No [data-winner] row found for label "${label}"`);
  }
  return row;
}

describe('ComparePage', () => {
  it('renders the matchup with per-metric winners and the shared-games list', () => {
    snapshotByKeyMock.mockImplementation((key) =>
      key === 'dad' ? sampleSnapshot('dad', 'Dad') : sampleSnapshot('braidan', 'Braidan'),
    );

    renderAt('/compare/dad/braidan');

    expect(screen.getByRole('heading', { level: 1, name: /Dad versus Braidan/i })).toBeInTheDocument();

    // Dad wins platinums (2 vs 1); braidan wins playtime; games played is a tie.
    expect(rowByLabel('Platinum trophies')).toHaveAttribute('data-winner', 'a');
    expect(rowByLabel('Total play time (minutes)')).toHaveAttribute('data-winner', 'b');
    expect(rowByLabel('Games played')).toHaveAttribute('data-winner', 'tie');

    // Shared games (sorted by combined playtime): Rocket League + God of War.
    expect(screen.getByText('God of War Ragnarök')).toBeInTheDocument();
    expect(screen.getByText('Rocket League®')).toBeInTheDocument();
  });

  it('renders the shared-games empty state when the players share no titles', () => {
    snapshotByKeyMock.mockImplementation((key) =>
      key === 'dad' ? sampleSnapshot('dad', 'Dad') : emptySnapshot,
    );

    renderAt('/compare/dad/braidan');

    // Scoreboard still renders (the matchup exists)…
    expect(screen.getByRole('heading', { level: 1, name: /Dad versus Braidan/i })).toBeInTheDocument();
    // …but there are no shared games, so the deep list shows its empty state.
    expect(screen.getByText(/no shared games yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('renders a styled empty state when a snapshot is missing', () => {
    snapshotByKeyMock.mockImplementation((key) =>
      key === 'dad' ? sampleSnapshot('dad', 'Dad') : undefined,
    );

    renderAt('/compare/dad/braidan');

    // The empty state names the specific pair rather than "both players".
    expect(
      screen.getByText('Stats for Dad and Braidan need to be synced before they can be compared.'),
    ).toBeInTheDocument();
    // The VS hero (and its "versus" heading) never renders without both snapshots.
    expect(screen.queryByRole('heading', { name: /versus/i })).not.toBeInTheDocument();
  });

  it('follows the route params, so the reversed pair puts braidan on the left', () => {
    snapshotByKeyMock.mockImplementation((key) =>
      key === 'dad' ? sampleSnapshot('dad', 'Dad') : sampleSnapshot('braidan', 'Braidan'),
    );

    renderAt('/compare/braidan/dad');

    expect(screen.getByRole('heading', { level: 1, name: 'Braidan versus Dad' })).toBeInTheDocument();
  });

  it.each([
    ['an unknown key', '/compare/dad/nobody'],
    ['a missing param', '/compare/dad'],
    ['a player against themselves', '/compare/dad/dad'],
  ])('renders the not-found page for %s', (_label, path) => {
    snapshotByKeyMock.mockImplementation((key) => sampleSnapshot(key, key));

    renderAt(path);

    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /versus/i })).not.toBeInTheDocument();
  });
});
