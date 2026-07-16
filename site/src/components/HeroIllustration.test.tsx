import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HeroIllustration } from './HeroIllustration';

describe('HeroIllustration', () => {
  it('exposes a single labelled image to assistive tech', () => {
    render(<HeroIllustration />);

    const img = screen.getByRole('img');
    expect(img).toHaveAccessibleName(/controller/i);
  });

  it('keeps the decorative shape accents out of the accessible name', () => {
    render(<HeroIllustration />);

    // The wrapper is the only image; the inner SVG and its shape glyphs are
    // aria-hidden, so nothing announces "triangle"/"circle"/"square"/"cross".
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.queryByRole('img', { name: /triangle|circle|square|cross/i })).toBeNull();
  });
});
