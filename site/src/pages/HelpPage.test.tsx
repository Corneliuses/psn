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
  it('renders the heading, the scope statement and the chat', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Help desk' })).toBeInTheDocument();
    expect(screen.getByText(/only talks about playing games/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Ask the help desk' })).toBeInTheDocument();
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
