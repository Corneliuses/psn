import { formatMinutes } from 'psn/duration';
import {
  gamesWithMostTrophies,
  mostPlayedGames,
  platinumGames,
  recentGames,
} from 'psn/stats';
import type { PlayerSnapshot } from 'psn';

import { GameSection, type GameEntry } from '../components/GameSection';
import { playerByKey } from '../config/players';
import { snapshotByKey } from '../data';
import { formatDate } from '../format';

export interface PlayerPageProps {
  playerKey: string;
}

function sectionEntries(snapshot: PlayerSnapshot): { heading: string; games: GameEntry[] }[] {
  return [
    {
      heading: 'Recent games',
      games: recentGames(snapshot).map((t) => ({
        id: t.titleId,
        iconUrl: t.imageUrl,
        name: t.name,
        metric: `Last played ${formatDate(t.lastPlayed)}`,
      })),
    },
    {
      heading: 'Most played',
      games: mostPlayedGames(snapshot).map((t) => ({
        id: t.titleId,
        iconUrl: t.imageUrl,
        name: t.name,
        metric: formatMinutes(t.playDurationMinutes),
      })),
    },
    {
      heading: 'Most trophies',
      games: gamesWithMostTrophies(snapshot).map((t) => ({
        id: t.npCommunicationId,
        iconUrl: t.iconUrl,
        name: t.name,
        metric: `${t.earnedTotal} trophies`,
      })),
    },
    {
      heading: 'Platinum games',
      games: platinumGames(snapshot).map((t) => ({
        id: t.npCommunicationId,
        iconUrl: t.iconUrl,
        name: t.name,
        metric: `Platinum · ${t.earnedTotal} trophies · ${formatDate(t.lastTrophyAt)}`,
      })),
    },
  ];
}

export function PlayerPage({ playerKey }: PlayerPageProps) {
  const player = playerByKey(playerKey);

  if (!player) {
    return (
      <main>
        <h1>Player not found</h1>
      </main>
    );
  }

  const snapshot = snapshotByKey(playerKey);

  return (
    <main>
      <h1>{player.displayName}&rsquo;s stats</h1>
      {snapshot ? (
        sectionEntries(snapshot).map((section) => (
          <GameSection key={section.heading} heading={section.heading} games={section.games} />
        ))
      ) : (
        <p>No stats synced yet.</p>
      )}
    </main>
  );
}
