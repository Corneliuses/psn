import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { HelpPage } from './HelpPage';
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
    // No second pitch inside the chat: the hero already says what this is for.
    expect(screen.queryByText('What are you stuck on?')).toBeNull();
    expect(screen.getByLabelText('Your question')).toBeInTheDocument();
  });

  it('pre-fills the game from the ?game= query a companion app links with', () => {
    renderPage(helpPath('Grounded 2'));
    expect(screen.getByLabelText('Game (optional)')).toHaveValue('Grounded 2');
  });
});
