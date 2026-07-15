import { Link } from 'react-router';

import { PlaceholderGraphic } from '../components/PlaceholderGraphic';
import { players } from '../config/players';
import { COMPARE_PATH, playerPath } from '../routes';

export function SplashPage() {
  return (
    <main>
      <PlaceholderGraphic />
      <h1>Dad &amp; Braidan&rsquo;s PlayStation Stats</h1>
      <nav>
        <ul>
          {players.map((player) => (
            <li key={player.key}>
              <Link to={playerPath(player.key)}>{player.displayName}&rsquo;s stats</Link>
            </li>
          ))}
          <li>
            <Link to={COMPARE_PATH}>Compare</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
