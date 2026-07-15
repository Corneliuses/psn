import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PlayerPage } from './PlayerPage';

describe('PlayerPage', () => {
  it.each([
    ['dad', 'Dad'],
    ['braidan', 'Braidan'],
  ])('renders a placeholder naming %s', (playerKey, displayName) => {
    render(<PlayerPage playerKey={playerKey} />);
    expect(screen.getByRole('heading', { name: new RegExp(displayName) })).toBeInTheDocument();
  });

  it('renders a not-found state for an unknown key', () => {
    render(<PlayerPage playerKey="stranger" />);
    expect(screen.getByRole('heading', { name: /not found/i })).toBeInTheDocument();
  });
});
