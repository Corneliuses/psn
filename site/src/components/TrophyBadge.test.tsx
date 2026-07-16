import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TrophyBadge, type TrophyTier } from './TrophyBadge';

describe('TrophyBadge', () => {
  it('exposes an accessible label naming the tier and count', () => {
    render(<TrophyBadge tier="platinum" count={3} />);
    expect(screen.getByRole('img', { name: '3 platinum trophies' })).toBeInTheDocument();
  });

  it('uses the singular "trophy" for a count of one', () => {
    render(<TrophyBadge tier="gold" count={1} />);
    expect(screen.getByRole('img', { name: '1 gold trophy' })).toBeInTheDocument();
  });

  it('renders the visible count', () => {
    render(<TrophyBadge tier="bronze" count={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('colors the marker with the matching trophy-metal token per tier', () => {
    const cases: Array<[TrophyTier, string]> = [
      ['bronze', 'text-trophy-bronze'],
      ['silver', 'text-trophy-silver'],
      ['gold', 'text-trophy-gold'],
      ['platinum', 'text-trophy-platinum'],
    ];
    for (const [tier, tokenClass] of cases) {
      const { unmount } = render(<TrophyBadge tier={tier} count={1} />);
      const marker = screen.getByRole('img').querySelector('[aria-hidden="true"]');
      expect(marker?.className).toContain(tokenClass);
      unmount();
    }
  });
});
