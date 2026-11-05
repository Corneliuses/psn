import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PlayerAccent } from '../config/accents';
import { TriClashMeter } from './TriClashMeter';
import type { TriClashEntry } from './TriClashMeter';

const accent = (glyph: string, shape: string): PlayerAccent => ({
  glyph,
  text: `text-shape-${shape}`,
  fill: `fill-shape-${shape}`,
  colorVar: `var(--color-shape-${shape})`,
});

function entries(values: [number, number, number]): TriClashEntry[] {
  return [
    { key: 'dad', name: 'Dad', value: values[0], accent: accent('△', 'triangle') },
    { key: 'braidan', name: 'Braidan', value: values[1], accent: accent('○', 'circle') },
    { key: 'nadia', name: 'Nadia', value: values[2], accent: accent('✕', 'cross') },
  ];
}

/** Each segment's width, as a percentage number (0–100), in order. */
function segmentWidths(container: HTMLElement): number[] {
  return [...container.querySelectorAll<HTMLElement>('[data-segment]')].map((el) =>
    parseFloat(el.style.width),
  );
}

function seamLefts(container: HTMLElement): number[] {
  return [...container.querySelectorAll<HTMLElement>('[data-seam]')].map((el) =>
    parseFloat(el.style.left),
  );
}

function item(name: string): HTMLElement {
  const list = screen.getByRole('list', { name: 'Total trophies' });
  return within(list)
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes(name))!;
}

describe('TriClashMeter', () => {
  it('renders the label, every player name, and every final value', () => {
    render(<TriClashMeter label="Total trophies" entries={entries([150, 101, 49])} leaders={['dad']} />);

    expect(screen.getByText('Total trophies')).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Total trophies' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    for (const [name, value] of [['Dad', '150'], ['Braidan', '101'], ['Nadia', '49']] as const) {
      expect(within(item(name)).getByText(name)).toBeInTheDocument();
      expect(within(item(name)).getByText(value)).toBeInTheDocument();
    }
  });

  it('splits the track proportionally with a seam at each division', () => {
    const { container } = render(
      <TriClashMeter label="Total trophies" entries={entries([50, 30, 20])} leaders={['dad']} />,
    );

    const [a, b, c] = segmentWidths(container);
    expect(a).toBeCloseTo(50);
    expect(b).toBeCloseTo(30);
    expect(c).toBeCloseTo(20);
    const [s1, s2] = seamLefts(container);
    expect(s1).toBeCloseTo(50);
    expect(s2).toBeCloseTo(80);
  });

  it('emphasises the leader from `leaders` and mutes the rest', () => {
    const { container } = render(
      <TriClashMeter label="Total trophies" entries={entries([10, 99, 98])} leaders={['braidan']} />,
    );

    expect(container.querySelector('[data-leaders]')).toHaveAttribute('data-leaders', 'braidan');
    expect(item('Braidan')).toHaveAttribute('data-leader', 'true');
    expect(within(item('Braidan')).getByText('99').parentElement).toHaveClass('text-2xl');
    expect(within(item('Braidan')).getByText('(leader)')).toHaveClass('sr-only');
    for (const name of ['Dad', 'Nadia']) {
      expect(item(name)).toHaveAttribute('data-leader', 'false');
      expect(within(item(name)).queryByText('(leader)')).toBeNull();
    }
    expect(within(item('Nadia')).getByText('98').parentElement).toHaveClass('text-foreground-muted');
  });

  it('glows every tied leader in a partial tie', () => {
    render(<TriClashMeter label="Total trophies" entries={entries([7, 7, 3])} leaders={['dad', 'braidan']} />);

    expect(item('Dad')).toHaveAttribute('data-leader', 'true');
    expect(item('Braidan')).toHaveAttribute('data-leader', 'true');
    expect(item('Nadia')).toHaveAttribute('data-leader', 'false');
  });

  it('renders a full tie neutrally with an even split', () => {
    const { container } = render(
      <TriClashMeter label="Total trophies" entries={entries([4, 4, 4])} leaders={['dad', 'braidan', 'nadia']} />,
    );

    expect(container.querySelector('[data-leaders]')).toHaveAttribute('data-leaders', 'tie');
    for (const value of screen.getAllByText('4')) {
      expect(value.parentElement).toHaveClass('text-foreground-muted');
    }
    expect(screen.queryByText('(leader)')).toBeNull();
    for (const w of segmentWidths(container)) expect(w).toBeCloseTo(100 / 3);
  });

  it('handles an all-zero row without dividing by zero (even split, neutral)', () => {
    const { container } = render(
      <TriClashMeter label="Total trophies" entries={entries([0, 0, 0])} leaders={['dad', 'braidan', 'nadia']} />,
    );

    expect(container.querySelector('[data-leaders]')).toHaveAttribute('data-leaders', 'tie');
    const widths = segmentWidths(container);
    expect(widths.every((w) => Number.isFinite(w))).toBe(true);
    for (const w of widths) expect(w).toBeCloseTo(100 / 3);
  });

  it('applies a custom formatter and trophy tier tint', () => {
    render(
      <TriClashMeter
        label="Gold"
        entries={entries([3, 2, 1])}
        leaders={['dad']}
        tier="gold"
        format={(n) => `${n}g`}
      />,
    );

    expect(screen.getByText('Gold').parentElement).toHaveClass('text-trophy-gold');
    expect(screen.getByText('3g')).toBeInTheDocument();
  });

  it('keeps shape glyphs decorative', () => {
    render(<TriClashMeter label="Total trophies" entries={entries([1, 2, 3])} leaders={['nadia']} />);

    for (const glyph of ['△', '○', '✕']) {
      expect(screen.getByText(glyph)).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('treats an empty leaders list as neutral instead of dimming everyone', () => {
    const { container } = render(<TriClashMeter label="Total trophies" entries={entries([1, 2, 3])} leaders={[]} />);

    expect(container.querySelector('[data-leaders]')).toHaveAttribute('data-leaders', 'tie');
    for (const el of container.querySelectorAll<HTMLElement>('[data-segment]')) {
      expect(el.style.opacity).toBe('0.8');
    }
  });

  it('rounds the first visible segment and drops seams beside a zero-width segment', () => {
    const { container } = render(
      <TriClashMeter label="Total trophies" entries={entries([0, 40, 60])} leaders={['nadia']} />,
    );

    const [dad, braidan, nadia] = [...container.querySelectorAll<HTMLElement>('[data-segment]')];
    expect(dad).not.toHaveClass('rounded-l-pill');
    expect(braidan).toHaveClass('rounded-l-pill');
    expect(nadia).toHaveClass('rounded-r-pill');
    const lefts = seamLefts(container);
    expect(lefts).toHaveLength(1);
    expect(lefts[0]).toBeCloseTo(40);
  });
});

