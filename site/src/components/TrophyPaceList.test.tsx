import { render, screen } from '@testing-library/react';
import type { TrophyPaceInterval } from 'psn/stats';
import { describe, expect, it } from 'vitest';

import { TrophyPaceList } from './TrophyPaceList';

const intervals: TrophyPaceInterval[] = [
  {
    from: '2026-07-13T00:00:00.000Z',
    to: '2026-07-15T00:00:00.000Z',
    earned: { bronze: 3, silver: 0, gold: 0, platinum: 1 },
    total: 4,
  },
];

describe('TrophyPaceList', () => {
  it('renders a row per interval with its date span and tier badges', () => {
    render(<TrophyPaceList intervals={intervals} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText(/Jul 13, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Jul 15, 2026/)).toBeInTheDocument();
    // Only non-empty tiers render, each as a labelled badge.
    expect(screen.getByRole('img', { name: '1 platinum trophy' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 bronze trophies' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /silver/ })).not.toBeInTheDocument();
  });

  it('shows a no-trophies label for a zero-total interval', () => {
    render(
      <TrophyPaceList
        intervals={[
          {
            from: '2026-07-13T00:00:00.000Z',
            to: '2026-07-15T00:00:00.000Z',
            earned: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
            total: 0,
          },
        ]}
      />,
    );

    expect(screen.getByText(/no trophies earned/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the empty state with fewer than two snapshots (no intervals)', () => {
    render(<TrophyPaceList intervals={[]} />);

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByText(/needs at least two snapshots/i)).toBeInTheDocument();
  });
});
