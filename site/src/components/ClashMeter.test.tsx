import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ClashMeter } from './ClashMeter';
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

function renderMeter(props: { a: number; b: number; winner: 'a' | 'b' | 'tie' }) {
  return render(
    <ClashMeter label="Total trophies" accentA={accentA} accentB={accentB} {...props} />,
  );
}

/** The seam's horizontal position, as a percentage number (0–100). */
function seamLeft(container: HTMLElement): number {
  const seam = container.querySelector<HTMLElement>('.z-10');
  return parseFloat(seam?.style.left ?? '');
}

describe('ClashMeter', () => {
  it('renders the label and both values as text', () => {
    renderMeter({ a: 150, b: 101, winner: 'a' });

    expect(screen.getByText('Total trophies')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();
  });

  it('indicates player A as the winner (emphasised value, muted loser)', () => {
    const { container } = renderMeter({ a: 150, b: 101, winner: 'a' });

    expect(container.querySelector('[data-winner]')).toHaveAttribute('data-winner', 'a');
    // AnimatedNumber renders the number in an inner span; the size/mute treatment
    // lives on the wrapping value span.
    expect(screen.getByText('150').parentElement).toHaveClass('text-2xl');
    expect(screen.getByText('101').parentElement).toHaveClass('text-foreground-muted');
  });

  it('indicates player B as the winner', () => {
    const { container } = renderMeter({ a: 101, b: 150, winner: 'b' });

    expect(container.querySelector('[data-winner]')).toHaveAttribute('data-winner', 'b');
    expect(screen.getByText('150').parentElement).toHaveClass('text-2xl');
    expect(screen.getByText('101').parentElement).toHaveClass('text-foreground-muted');
  });

  it('renders a tie neutrally: no emphasis, seam centred', () => {
    const { container } = renderMeter({ a: 4, b: 4, winner: 'tie' });

    expect(container.querySelector('[data-winner]')).toHaveAttribute('data-winner', 'tie');
    for (const value of screen.getAllByText('4')) {
      expect(value.parentElement).toHaveClass('text-foreground-muted');
      expect(value.parentElement).not.toHaveClass('text-2xl');
    }
    // Both sides equal → seam sits dead-centre.
    expect(seamLeft(container)).toBeCloseTo(50);
  });

  it('handles a zero/zero row without dividing by zero (centred, neutral)', () => {
    const { container } = renderMeter({ a: 0, b: 0, winner: 'tie' });

    expect(container.querySelector('[data-winner]')).toHaveAttribute('data-winner', 'tie');
    expect(seamLeft(container)).toBeCloseTo(50);
  });
});
