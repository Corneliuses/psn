import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';

import { HelpDeskCta } from './HelpDeskCta';

describe('HelpDeskCta', () => {
  it('is a link to the help desk named exactly "Get help with your game"', () => {
    render(
      <MemoryRouter>
        <HelpDeskCta />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Get help with your game' });
    expect(link).toHaveAttribute('href', '/help');
  });

  it('keeps the spark and arrow decorative and the supporting line outside the link', () => {
    render(
      <MemoryRouter>
        <HelpDeskCta />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(link).not.toHaveTextContent('Stuck on a boss');
    expect(screen.getByText(/Stuck on a boss/)).toBeInTheDocument();
  });
});
