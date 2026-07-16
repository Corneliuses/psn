import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GameSection, type GameEntry } from './GameSection';

const entries: GameEntry[] = [
  { id: 'a', iconUrl: 'https://image.example/a.png', name: 'Elden Ring', metric: '210h 3m' },
  { id: 'b', iconUrl: 'https://image.example/b.png', name: 'Rocket League®', metric: '96h 40m' },
];

describe('GameSection', () => {
  it('renders the heading and one row per game with icon, name, and metric', () => {
    render(<GameSection heading="Most played" games={entries} />);

    expect(screen.getByRole('heading', { name: 'Most played' })).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);

    // The icon is decorative (empty alt), so it is absent from the
    // accessibility tree; assert on the underlying <img> element directly.
    const icon = items[0]!.querySelector('img');
    expect(icon).toHaveAttribute('src', 'https://image.example/a.png');
    expect(icon).toHaveAttribute('alt', '');

    const first = within(items[0]!);
    expect(first.getByText('Elden Ring')).toBeInTheDocument();
    expect(first.getByText('210h 3m')).toBeInTheDocument();
  });

  it('renders the empty label and no list when there are no games', () => {
    render(<GameSection heading="Platinum games" games={[]} emptyLabel="No platinums yet" />);

    expect(screen.getByRole('heading', { name: 'Platinum games' })).toBeInTheDocument();
    expect(screen.getByText('No platinums yet')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('falls back to a default empty label', () => {
    render(<GameSection heading="Recent games" games={[]} />);
    expect(screen.getByText('No games yet')).toBeInTheDocument();
  });
});
