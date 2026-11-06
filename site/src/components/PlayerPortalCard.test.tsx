import { render, screen, within } from '@testing-library/react';
import { sampleSnapshot } from 'psn';
import { playerTotals } from 'psn/stats';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';

import { PlayerPortalCard } from './PlayerPortalCard';

const dad = { key: 'dad', displayName: 'Dad' };

function renderCard(totals?: ReturnType<typeof playerTotals>) {
  return render(
    <MemoryRouter>
      <PlayerPortalCard player={dad} {...(totals ? { totals } : {})} />
    </MemoryRouter>,
  );
}

describe('PlayerPortalCard', () => {
  it('is one link to the player page, named after the player', () => {
    renderCard(playerTotals(sampleSnapshot('dad', 'Dad')));

    const link = screen.getByRole('link', { name: /Dad/ });
    expect(link).toHaveAttribute('href', '/dad');
    expect(link).toHaveTextContent('Explore Dad’s trophies & playtime');
  });

  it('shows every trophy tier count and no playtime or game stats', () => {
    const totals = playerTotals(sampleSnapshot('dad', 'Dad'));
    renderCard(totals);

    const link = screen.getByRole('link', { name: /Dad/ });
    for (const tier of ['bronze', 'silver', 'gold', 'platinum'] as const) {
      expect(
        within(link).getByRole('img', { name: new RegExp(`^${totals.trophies[tier]} ${tier} troph`) }),
      ).toBeInTheDocument();
    }
    expect(within(link).getAllByRole('img')).toHaveLength(4);
    expect(within(link).queryByText('Played')).not.toBeInTheDocument();
    expect(within(link).queryByText('Games')).not.toBeInTheDocument();
  });

  it('still renders the portal without a snapshot, saying no stats are synced', () => {
    renderCard();

    const link = screen.getByRole('link', { name: /Dad/ });
    expect(link).toHaveAttribute('href', '/dad');
    expect(within(link).getByText('No stats synced yet')).toBeInTheDocument();
    expect(within(link).queryByRole('img')).not.toBeInTheDocument();
  });

  it('keeps the accent glyphs decorative', () => {
    const { container } = renderCard();

    for (const glyph of container.querySelectorAll('[aria-hidden="true"]')) {
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
    }
    // The name itself is real text, not hidden behind the glyph chip.
    expect(screen.getByText('Dad')).not.toHaveAttribute('aria-hidden');
  });
});
