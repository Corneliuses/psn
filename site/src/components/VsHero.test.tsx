import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VsHero } from './VsHero';
import type { PlayerAccent } from '../config/accents';

const accentA: PlayerAccent = {
  glyph: '△',
  text: 'text-shape-triangle',
  fill: 'fill-shape-triangle',
  colorVar: 'var(--color-shape-triangle)',
};
const accentB: PlayerAccent = {
  glyph: '○',
  text: 'text-shape-circle',
  fill: 'fill-shape-circle',
  colorVar: 'var(--color-shape-circle)',
};

describe('VsHero', () => {
  it('renders one level-1 heading naming the matchup', () => {
    render(<VsHero nameA="Dad" nameB="Braidan" accentA={accentA} accentB={accentB} />);

    expect(screen.getByRole('heading', { level: 1, name: /Dad versus Braidan/i })).toBeInTheDocument();
  });

  it('shows both display names', () => {
    render(<VsHero nameA="Dad" nameB="Braidan" accentA={accentA} accentB={accentB} />);

    expect(screen.getByText('Dad')).toBeInTheDocument();
    expect(screen.getByText('Braidan')).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
  });
});
