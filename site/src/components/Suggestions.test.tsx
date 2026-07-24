import { render, screen, within } from '@testing-library/react';
import type { SuggestionsFile } from 'psn/suggestions';
import { describe, expect, it } from 'vitest';

import { Suggestions } from './Suggestions';

const suggestions: SuggestionsFile = {
  by_genre: {
    Action: [
      { name: 'Returnal', rawgId: 326243, rating: 86, released: '2021-04-30' },
      { name: 'Ghost of Tsushima', rawgId: 422635, rating: 83, released: '2020-07-17' },
    ],
    RPG: [{ name: 'Persona 5 Royal', rawgId: 326900, rating: 94, released: '2020-03-31' }],
  },
  shared_genres: ['Action', 'RPG'],
  metadata: {
    generated_at: '2026-07-15T00:00:00.000Z',
    rawg_base_url: 'https://rawg.io',
    attribution: 'Data from RAWG.io',
    build: 'v0.1.0',
  },
};

describe('Suggestions', () => {
  it('renders one heading and listitem group per shared genre, linking each game to its RAWG page', () => {
    render(<Suggestions suggestions={suggestions} />);

    expect(screen.getByRole('heading', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'RPG' })).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);

    const returnalLink = screen.getByRole('link', { name: /Returnal/ });
    expect(returnalLink).toHaveAttribute('href', 'https://rawg.io/games/326243');
    expect(within(returnalLink).getByText(/86.*2021/)).toBeInTheDocument();
  });

  it('renders the RAWG attribution link', () => {
    render(<Suggestions suggestions={suggestions} />);
    const attribution = screen.getByRole('link', { name: 'RAWG' });
    expect(attribution).toHaveAttribute('href', 'https://rawg.io');
  });

  it('renders an empty state when there are no suggestions for any shared genre', () => {
    render(
      <Suggestions
        suggestions={{ ...suggestions, by_genre: {}, shared_genres: [] }}
      />,
    );
    expect(screen.getByText(/no suggestions yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('treats a shared genre with an empty suggestion list as not present', () => {
    render(
      <Suggestions
        suggestions={{ ...suggestions, by_genre: { Action: [] }, shared_genres: ['Action'] }}
      />,
    );
    expect(screen.getByText(/no suggestions yet/i)).toBeInTheDocument();
  });
});
