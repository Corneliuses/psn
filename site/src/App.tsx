import { Route, Routes } from 'react-router';

import { AppShell } from './components/AppShell';
import { players } from './config/players';
import { ComparePage } from './pages/ComparePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlayerPage } from './pages/PlayerPage';
import { SplashPage } from './pages/SplashPage';
import { COMPARE_PATH, playerPath } from './routes';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        {players.map((player) => (
          <Route key={player.key} path={playerPath(player.key)} element={<PlayerPage playerKey={player.key} />} />
        ))}
        <Route path={COMPARE_PATH} element={<ComparePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
