import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';

import { players } from '../config/players';
import { SplashPage } from './SplashPage';

describe('SplashPage', () => {
  it('renders a link for every configured player plus Compare', () => {
    render(
      <MemoryRouter>
        <SplashPage />
      </MemoryRouter>,
    );

    for (const player of players) {
      const link = screen.getByRole('link', { name: new RegExp(player.displayName) });
      expect(link).toHaveAttribute('href', `/${player.key}`);
    }

    expect(screen.getByRole('link', { name: 'Compare' })).toHaveAttribute('href', '/compare');
  });
});
