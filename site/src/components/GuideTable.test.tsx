import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GuideTable } from './GuideTable';
import type { GuideTableContent } from '../companions/types';

const guide: GuideTableContent = {
  title: 'Equipment',
  intro: 'What we have built and what it is for.',
  columns: [
    { id: 'name', label: 'Item' },
    { id: 'use', label: 'Best against' },
    { id: 'tier', label: 'Tier', numeric: true },
  ],
  rows: [
    { id: 'spear', cells: { name: 'Spear', use: 'Fast bugs', tier: 1 } },
    { id: 'hammer', cells: { name: 'Hammer', use: 'Armoured shells', tier: 3 } },
    { id: 'bow', cells: { name: 'Bow', use: 'Pulling single targets', tier: 2 } },
  ],
};

/** Row labels in render order, skipping the header row. */
function bodyRowNames(): string[] {
  const [, ...rows] = screen.getAllByRole('row');
  return rows.map((row) => within(row).getAllByRole('cell')[0]!.textContent ?? '');
}

describe('GuideTable', () => {
  it('renders the heading, intro and every row in content order', () => {
    render(<GuideTable guide={guide} />);

    expect(screen.getByRole('heading', { name: 'Equipment' })).toBeInTheDocument();
    expect(screen.getByText('What we have built and what it is for.')).toBeInTheDocument();
    expect(bodyRowNames()).toEqual(['Spear', 'Hammer', 'Bow']);
  });

  it('sorts by a text column, reversing on a second click, and reports order via aria-sort', () => {
    render(<GuideTable guide={guide} />);

    fireEvent.click(screen.getByRole('button', { name: /Item/ }));
    expect(bodyRowNames()).toEqual(['Bow', 'Hammer', 'Spear']);
    expect(screen.getByRole('columnheader', { name: /Item/ })).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(screen.getByRole('button', { name: /Item/ }));
    expect(bodyRowNames()).toEqual(['Spear', 'Hammer', 'Bow']);
    expect(screen.getByRole('columnheader', { name: /Item/ })).toHaveAttribute('aria-sort', 'descending');
  });

  it('sorts a numeric column numerically, not as text', () => {
    render(<GuideTable guide={guide} />);

    fireEvent.click(screen.getByRole('button', { name: /Tier/ }));
    expect(bodyRowNames()).toEqual(['Spear', 'Bow', 'Hammer']);
  });

  it('filters rows against every cell and reports when nothing matches', () => {
    render(<GuideTable guide={guide} />);

    const filter = screen.getByRole('searchbox', { name: /filter equipment/i });
    fireEvent.change(filter, { target: { value: 'armoured' } });
    expect(bodyRowNames()).toEqual(['Hammer']);

    fireEvent.change(filter, { target: { value: 'nothing here' } });
    expect(bodyRowNames()).toEqual([]);
    expect(screen.getByText(/nothing matches/i)).toBeInTheDocument();
  });
});
