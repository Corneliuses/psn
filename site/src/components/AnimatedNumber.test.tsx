import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AnimatedNumber } from './AnimatedNumber';

describe('AnimatedNumber', () => {
  it('renders the final value immediately (no timers) in jsdom', () => {
    render(<AnimatedNumber value={1234} />);
    // Default format groups thousands.
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('applies a custom format function to the final value', () => {
    render(<AnimatedNumber value={87} format={(n) => `${Math.round(n)}%`} />);
    expect(screen.getByText('87%')).toBeInTheDocument();
  });

  it('renders zero without a count-up', () => {
    render(<AnimatedNumber value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
