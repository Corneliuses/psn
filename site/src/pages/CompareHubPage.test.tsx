import { render, screen, within } from '@testing-library/react';
import { sampleSnapshot } from 'psn';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CompareHubPage } from './CompareHubPage';
import { players } from '../config/players';
import { snapshotByKey } from '../data';
import { comparePath, playerPairings } from '../routes';

vi.mock('../data');

const snapshotByKeyMock = vi.mocked(snapshotByKey);

beforeEach(() => {
  snapshotByKeyMock.mockReset();
  snapshotByKeyMock.mockImplementation((key) => {
    const player = players.find((p) => p.key === key);
    return player ? sampleSnapshot(player.key, player.displayName) : undefined;
  });
});

function renderHub() {
  return render(
    <MemoryRouter>
      <CompareHubPage />
    </MemoryRouter>,
  );
}

describe('CompareHubPage', () => {
  it('leads with a Compare heading', () => {
    renderHub();
    expect(screen.getByRole('heading', { level: 1, name: 'Compare' })).toBeInTheDocument();
  });

  it('renders one matchup card per pairing', () => {
    expect(playerPairings.length).toBeGreaterThanOrEqual(1);
    renderHub();
    const list = screen.getByRole('list', { name: 'Matchups' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(playerPairings.length);
  });

  it.each(playerPairings)(
    'links $a.key vs $b.key to its pairwise page with an accessible name',
    ({ a, b }) => {
      renderHub();
      const link = screen.getByRole('link', { name: `Compare ${a.displayName} and ${b.displayName}` });
      expect(link).toHaveAttribute('href', comparePath(a.key, b.key));
    },
  );

  it('keeps the VS treatment decorative', () => {
    renderHub();
    for (const vs of screen.getAllByText('VS')) {
      expect(vs).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('renders the family scoreboard with one meter per player per metric', () => {
    renderHub();
    expect(screen.getByRole('heading', { name: 'Family scoreboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Family trophy tiers' })).toBeInTheDocument();
    const trophies = screen.getByRole('list', { name: 'Total trophies' });
    const items = within(trophies).getAllByRole('listitem');
    expect(items).toHaveLength(players.length);
    for (const player of players) {
      expect(within(trophies).getByText(player.displayName)).toBeInTheDocument();
    }
  });

  it('lists the games played by everyone', () => {
    renderHub();
    expect(screen.getByRole('heading', { name: 'Played by everyone' })).toBeInTheDocument();
    // Every fixture snapshot shares the same sample titles.
    const shared = screen.getByRole('list', { name: 'Played by everyone' });
    expect(within(shared).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('hides the family scoreboard until every player has synced', () => {
    snapshotByKeyMock.mockImplementation((key) =>
      key === players[0]?.key ? sampleSnapshot(key, key) : undefined,
    );
    renderHub();
    expect(screen.getByRole('list', { name: 'Matchups' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Family scoreboard' })).toBeNull();
  });
});
