import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { CompanionPage } from './CompanionPage';
import { companions } from '../companions';
import { players } from '../config/players';

/** Render the companion route at one slug, the way App wires it up. */
function renderAt(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/together/${slug}`]}>
      <Routes>
        <Route path="/together/:slug" element={<CompanionPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const first = companions[0]!;

describe('CompanionPage', () => {
  it('renders the title heading and a way back to the index', () => {
    renderAt(first.slug);

    expect(screen.getByRole('heading', { level: 1, name: first.name })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /all companion apps/i })).toHaveAttribute('href', '/together');
  });

  it('renders the together stats with a card per configured player', () => {
    renderAt(first.slug);

    expect(screen.getByRole('heading', { name: /our time in this one/i })).toBeInTheDocument();
    for (const player of players) {
      expect(screen.getByRole('heading', { name: new RegExp(player.displayName) })).toBeInTheDocument();
    }
  });

  it('renders exactly the modules the companion declares', () => {
    renderAt(first.slug);

    const expectVisible = (present: unknown, name: RegExp) => {
      const heading = screen.queryByRole('heading', { name });
      if (present) expect(heading).toBeInTheDocument();
      else expect(heading).not.toBeInTheDocument();
    };

    expectVisible(first.quickReference?.length, /^quick reference$/i);
    expectVisible(first.map, /^map$/i);
    expectVisible(first.links?.length, /^help sites$/i);
    expectVisible(first.videos?.length, /^videos$/i);
    expectVisible(first.notes?.length, /^our notes$/i);
    for (const guide of first.guides ?? []) {
      expect(screen.getByRole('heading', { name: guide.title })).toBeInTheDocument();
    }
  });

  it('renders the not-found page for an unknown slug', () => {
    renderAt('a-game-we-have-not-added');

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
