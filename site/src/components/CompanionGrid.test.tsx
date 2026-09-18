import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { CompanionGrid } from './CompanionGrid';
import type { Companion } from '../companions/types';

const companion: Companion = {
  slug: 'grounded-2',
  name: 'Grounded 2',
  tagline: 'Shrunk in Brookhollow Park',
  blurb: 'Survival co-op at bug scale.',
  psnTitleNames: ['Grounded 2'],
  quickReference: [{ title: 'Damage types', items: [{ term: 'Smashing', detail: 'Hard shells.' }] }],
  links: [{ label: 'Wiki', href: 'https://example.test' }],
};

function renderGrid(companions: Companion[]) {
  return render(
    <MemoryRouter>
      <CompanionGrid companions={companions} />
    </MemoryRouter>,
  );
}

describe('CompanionGrid', () => {
  it('renders one tile per companion, linking to its app', () => {
    renderGrid([companion]);

    const tile = screen.getByRole('link', { name: /Grounded 2/ });
    expect(tile).toHaveAttribute('href', '/together/grounded-2');
    expect(screen.getByText('Shrunk in Brookhollow Park')).toBeInTheDocument();
  });

  it('lists only the modules a companion actually has', () => {
    renderGrid([companion]);

    expect(screen.getByText('Quick reference')).toBeInTheDocument();
    expect(screen.getByText('Help sites')).toBeInTheDocument();
    expect(screen.queryByText('Map')).not.toBeInTheDocument();
    expect(screen.queryByText('Videos')).not.toBeInTheDocument();
  });

  it('renders an empty state when no companions are registered', () => {
    renderGrid([]);

    expect(screen.getByText(/no companion apps yet/i)).toBeInTheDocument();
  });
});
