import { render, screen } from '@testing-library/react';
import type { PlayerSnapshot } from 'psn';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CompanionPage } from './CompanionPage';
import { companions } from '../companions';
import { players } from '../config/players';
import { snapshotByKey } from '../data';

/*
 * The snapshot module is mocked so this suite never depends on whichever real
 * titles happen to be in data/<player>/latest.json — a daily sync must not be
 * able to turn these assertions red. Each player gets a snapshot that has played
 * the companion's title, so the stats module renders its per-player cards.
 */
vi.mock('../data');

const snapshotByKeyMock = vi.mocked(snapshotByKey);

function snapshotFor(key: string, displayName: string, titleName: string): PlayerSnapshot {
  return {
    schemaVersion: 1,
    player: { key, displayName },
    capturedAt: '2026-09-12T00:00:00.000Z',
    playedTitles: [
      {
        titleId: `PPSA0000${key.length}_00`,
        name: titleName,
        imageUrl: '',
        category: 'ps5_native_game',
        playCount: 12,
        playDurationIso: 'PT10H',
        playDurationMinutes: 600,
        firstPlayed: '2026-08-11T00:00:00Z',
        lastPlayed: '2026-09-11T00:00:00Z',
      },
    ],
    trophyTitles: [],
  };
}

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

beforeEach(() => {
  snapshotByKeyMock.mockImplementation((key) => {
    const player = players.find((p) => p.key === key);
    return player ? snapshotFor(player.key, player.displayName, first.psnTitleNames[0]!) : undefined;
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('CompanionPage', () => {
  it('renders the title heading and a way back to the index', () => {
    renderAt(first.slug);

    expect(screen.getByRole('heading', { level: 1, name: first.name })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /all companion apps/i })).toHaveAttribute('href', '/together');
  });

  it('renders the together stats with a card per configured player', () => {
    renderAt(first.slug);

    expect(screen.getByRole('heading', { name: /our time in this one/i })).toBeInTheDocument();
    expect(players.length).toBeGreaterThan(0);
    for (const player of players) {
      expect(screen.getByRole('heading', { name: new RegExp(player.displayName) })).toBeInTheDocument();
    }
  });

  it('renders the stats empty state when no player has the title in their library', () => {
    snapshotByKeyMock.mockReturnValue(undefined);
    renderAt(first.slug);

    expect(screen.getByText(/neither of us has played this yet/i)).toBeInTheDocument();
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
