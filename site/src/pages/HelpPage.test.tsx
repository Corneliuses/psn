import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { HelpPage } from './HelpPage';
import { companions } from '../companions';
import { helpPath } from '../routes';

function renderPage(path = '/help') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <HelpPage />
    </MemoryRouter>,
  );
}

describe('HelpPage', () => {
  it('renders the heading, the one-line pitch and the chat', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Game help' })).toBeInTheDocument();
    expect(screen.getByText(/backed by a guide and a video/)).toBeInTheDocument();
    expect(screen.getByText('What are you stuck on?')).toBeInTheDocument();
    expect(screen.getByLabelText('Your question')).toBeInTheDocument();
  });

  it('offers a starter question per registered companion', () => {
    renderPage();
    expect(companions.length).toBeGreaterThan(0);
    for (const companion of companions) {
      expect(screen.getByRole('button', { name: `How do I get started in ${companion.name}?` })).toBeInTheDocument();
    }
  });

  it('pre-fills the game from the ?game= query a companion app links with', () => {
    renderPage(helpPath('Grounded 2'));
    expect(screen.getByLabelText('Game (optional)')).toHaveValue('Grounded 2');
  });
});
