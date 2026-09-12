import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { TogetherPage } from './TogetherPage';
import { companions } from '../companions';

describe('TogetherPage', () => {
  it('renders the page heading and a tile for every registered companion', () => {
    render(
      <MemoryRouter>
        <TogetherPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Together' })).toBeInTheDocument();
    // Tiles are derived from the registry — never a hardcoded list.
    expect(companions.length).toBeGreaterThan(0);
    for (const companion of companions) {
      expect(screen.getByRole('link', { name: new RegExp(companion.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }))
        .toHaveAttribute('href', `/together/${companion.slug}`);
    }
  });
});
