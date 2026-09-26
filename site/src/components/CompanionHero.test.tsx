import { render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { CompanionHero, type CompanionHeroProps } from './CompanionHero';

const companion: CompanionHeroProps['companion'] = {
  name: 'Night City Game',
  tagline: 'Rooftops after dark',
  blurb: 'A test title for the hero.',
  backdrop: 'skyline',
  facts: [
    { label: 'Platform', value: 'PS5' },
    { label: 'Co-op', value: '2 players, local' },
  ],
};

function renderHero(props: CompanionHeroProps['companion'] = companion) {
  return render(
    <MemoryRouter>
      <MotionConfig reducedMotion="always">
        <CompanionHero companion={props} />
      </MotionConfig>
    </MemoryRouter>,
  );
}

describe('CompanionHero', () => {
  it('renders the title as the page heading, the tagline, the blurb and a way back', () => {
    renderHero();

    expect(screen.getByRole('heading', { level: 1, name: 'Night City Game' })).toBeInTheDocument();
    expect(screen.getByText('Rooftops after dark')).toBeInTheDocument();
    expect(screen.getByText('A test title for the hero.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /all companion apps/i })).toHaveAttribute('href', '/together');
  });

  it('lists each fact as a term and its value', () => {
    renderHero();

    const terms = screen.getAllByRole('term').map((term) => term.textContent?.trim());
    const values = screen.getAllByRole('definition').map((value) => value.textContent);
    expect(terms).toEqual(['Platform', 'Co-op']);
    expect(values).toEqual(['PS5', '2 players, local']);
  });

  it('keeps the backdrop decorative, and renders none when the content asks for none', () => {
    const { container, unmount } = renderHero();

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).toBeNull();
    unmount();

    const plain = renderHero({ name: companion.name, tagline: companion.tagline, blurb: companion.blurb });
    expect(plain.container.querySelector('svg')).toBeNull();
    expect(screen.queryAllByRole('term')).toHaveLength(0);
  });
});
