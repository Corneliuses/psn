import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { CompareHubPage } from './CompareHubPage';
import { comparePath, playerPairings } from '../routes';

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
    const list = screen.getByRole('list');
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
});
