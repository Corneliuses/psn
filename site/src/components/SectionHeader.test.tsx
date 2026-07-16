import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('renders the title as a level-2 heading by default', () => {
    render(<SectionHeader title="Most played" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Most played' })).toBeInTheDocument();
  });

  it('honours a custom heading level', () => {
    render(<SectionHeader title="Trophies" as="h1" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Trophies' })).toBeInTheDocument();
  });

  it('renders the shape glyph as decorative (aria-hidden, absent from the a11y tree)', () => {
    const { container } = render(<SectionHeader title="Recent" />);
    const glyph = container.querySelector('[aria-hidden="true"]');
    expect(glyph).toBeInTheDocument();
    // The heading's accessible name is just the title, not the glyph.
    expect(screen.getByRole('heading').textContent).toBe('Recent');
  });

  it('rotates through the four PS shapes by shapeIndex, wrapping around', () => {
    const shapeFor = (i: number) => {
      const { container, unmount } = render(<SectionHeader title="S" shapeIndex={i} />);
      const glyph = container.querySelector('[aria-hidden="true"]')!.textContent;
      unmount();
      return glyph;
    };
    expect(shapeFor(0)).toBe('△');
    expect(shapeFor(1)).toBe('○');
    expect(shapeFor(2)).toBe('✕');
    expect(shapeFor(3)).toBe('□');
    // Wraps around.
    expect(shapeFor(4)).toBe('△');
  });
});
