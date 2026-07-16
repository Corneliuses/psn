import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('renders the label and the final value', () => {
    render(<StatTile label="Total trophies" value={1287} />);
    expect(screen.getByText('Total trophies')).toBeInTheDocument();
    expect(screen.getByText('1,287')).toBeInTheDocument();
  });

  it('applies a custom format to the value', () => {
    render(<StatTile label="Completion" value={73} format={(n) => `${Math.round(n)}%`} />);
    expect(screen.getByText('73%')).toBeInTheDocument();
  });
});
