import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CompanionMap } from './CompanionMap';
import type { CompanionMapContent } from '../companions/types';

const map: CompanionMapContent = {
  caption: 'A stylized sketch, not to scale.',
  zones: [{ id: 'yard', label: 'Open ground', x: 40, y: 40, rx: 20, ry: 20, tone: 'landmark' }],
  categories: [
    { id: 'base', label: 'Our bases', tone: 'base' },
    { id: 'danger', label: 'Avoid at night', tone: 'creature' },
  ],
  pins: [
    { id: 'home', name: 'Main base', categoryId: 'base', x: 30, y: 40, note: 'Shared stash by the door.' },
    { id: 'nest', name: 'Nest approach', categoryId: 'danger', x: 70, y: 70 },
  ],
};

describe('CompanionMap', () => {
  it('renders every pin, named by its category, plus the caption', () => {
    render(<CompanionMap map={map} />);

    expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Main base — Our bases' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nest approach — Avoid at night' })).toBeInTheDocument();
    expect(screen.getByText('A stylized sketch, not to scale.')).toBeInTheDocument();
  });

  it('shows a pin note when its pin is selected, and hides it again on reselect', () => {
    render(<CompanionMap map={map} />);

    const pin = screen.getByRole('button', { name: 'Main base — Our bases' });
    expect(screen.getByText(/select a pin/i)).toBeInTheDocument();

    fireEvent.click(pin);
    expect(screen.getByText('Shared stash by the door.')).toBeInTheDocument();
    expect(pin).toHaveAttribute('aria-current', 'true');

    fireEvent.click(pin);
    expect(screen.queryByText('Shared stash by the door.')).not.toBeInTheDocument();
  });

  it('falls back to a placeholder for a pin with no note', () => {
    render(<CompanionMap map={map} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nest approach — Avoid at night' }));
    expect(screen.getByText(/no notes on this one yet/i)).toBeInTheDocument();
  });

  it('filters pins by category and reports when every category is off', () => {
    render(<CompanionMap map={map} />);

    const basesFilter = screen.getByRole('button', { name: 'Our bases', pressed: true });
    fireEvent.click(basesFilter);

    expect(screen.queryByRole('button', { name: 'Main base — Our bases' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nest approach — Avoid at night' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Avoid at night', pressed: true }));
    expect(screen.getByText(/no pins shown/i)).toBeInTheDocument();
  });
});
