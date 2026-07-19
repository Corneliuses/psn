import { render, screen } from '@testing-library/react';
import type { PlaytimePoint } from 'psn/stats';
import { describe, expect, it } from 'vitest';

import { TrendChart } from './TrendChart';

const points: PlaytimePoint[] = [
  { capturedAt: '2026-07-13T00:00:00.000Z', playtimeMinutes: 100 },
  { capturedAt: '2026-07-14T00:00:00.000Z', playtimeMinutes: 250 },
  { capturedAt: '2026-07-15T00:00:00.000Z', playtimeMinutes: 400 },
];

describe('TrendChart', () => {
  it('renders an accessible chart naming the span and endpoints', () => {
    render(<TrendChart points={points} label="Playtime" />);

    const chart = screen.getByRole('img');
    expect(chart).toHaveAccessibleName(/playtime trend across 3 snapshots/i);
    // Endpoints are read into the label via formatMinutes.
    expect(chart).toHaveAccessibleName(/1h 40m/);
    expect(chart).toHaveAccessibleName(/6h 40m/);
  });

  it('shows a static "not enough history" state for a single point', () => {
    render(
      <TrendChart points={[{ capturedAt: '2026-07-15T00:00:00.000Z', playtimeMinutes: 100 }]} label="Playtime" />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(/not enough history yet/i)).toBeInTheDocument();
    expect(screen.getByText(/1h 40m/)).toBeInTheDocument();
  });

  it('shows the empty state with no points', () => {
    render(<TrendChart points={[]} label="Playtime" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(/not enough history yet/i)).toBeInTheDocument();
  });
});
