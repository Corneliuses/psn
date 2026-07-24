import { render, screen } from '@testing-library/react';
import type { SuggestionsFile } from 'psn/suggestions';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DiscoverPage } from './DiscoverPage';
import { suggestionsData } from '../data';

vi.mock('../data');

const suggestionsDataMock = vi.mocked(suggestionsData);

const withSuggestions: SuggestionsFile = {
  by_genre: { Action: [{ name: 'Returnal', rawgId: 326243, rating: 86, released: '2021-04-30' }] },
  shared_genres: ['Action'],
  metadata: {
    generated_at: '2026-07-15T00:00:00.000Z',
    rawg_base_url: 'https://rawg.io',
    attribution: 'Data from RAWG.io',
    build: 'v0.1.0',
  },
};

afterEach(() => {
  vi.resetAllMocks();
});

describe('DiscoverPage', () => {
  it('renders the page heading and the suggestions for each shared genre', () => {
    suggestionsDataMock.mockReturnValue(withSuggestions);

    render(<DiscoverPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Discover' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Returnal/ })).toHaveAttribute(
      'href',
      'https://rawg.io/games/326243',
    );
  });

  it('renders the Suggestions empty state when no shared genres have suggestions yet', () => {
    suggestionsDataMock.mockReturnValue({
      by_genre: {},
      shared_genres: [],
      metadata: withSuggestions.metadata,
    });

    render(<DiscoverPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Discover' })).toBeInTheDocument();
    expect(screen.getByText(/no suggestions yet/i)).toBeInTheDocument();
  });
});
