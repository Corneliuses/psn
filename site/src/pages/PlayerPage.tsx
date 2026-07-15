import { playerByKey } from '../config/players';

export interface PlayerPageProps {
  playerKey: string;
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

  return (
    <main>
      <h1>{player.displayName}&rsquo;s stats</h1>
      <p>Coming soon.</p>
    </main>
  );
}
