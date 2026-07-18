import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';

import { NotFoundPage } from './NotFoundPage';

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  it('renders a "page not found" heading', () => {
    renderNotFound();

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });

  it('renders a back-home link pointing at /', () => {
    renderNotFound();

    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
  });

  it('marks the oversized ✕ glyph as decorative (hidden from assistive tech)', () => {
    renderNotFound();

    // The heading and link carry the accessible meaning; the ✕ motif is decorative.
    expect(screen.getByText('✕')).toHaveAttribute('aria-hidden', 'true');
  });
});
