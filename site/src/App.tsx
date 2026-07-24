import { AnimatePresence } from 'motion/react';
import { Route, Routes, useLocation } from 'react-router';

import { AppShell } from './components/AppShell';
import { RouteTransition } from './components/RouteTransition';
import { players } from './config/players';
import { ComparePage } from './pages/ComparePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlayerPage } from './pages/PlayerPage';
import { SplashPage } from './pages/SplashPage';
import { COMPARE_PATH, DISCOVER_PATH, playerPath } from './routes';

export function App() {
  // Freeze the location so the outgoing route keeps rendering its old element
  // during the exit animation; `AnimatePresence mode="wait"` serializes
  // exit → enter (one routed <main> at a time). `initial={false}` skips the
  // route-level enter on first paint so each page's own entrance isn't doubled.
  const location = useLocation();

  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <RouteTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<SplashPage />} />
            {players.map((player) => (
              <Route key={player.key} path={playerPath(player.key)} element={<PlayerPage playerKey={player.key} />} />
            ))}
            <Route path={COMPARE_PATH} element={<ComparePage />} />
            <Route path={DISCOVER_PATH} element={<DiscoverPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </RouteTransition>
      </AnimatePresence>
    </AppShell>
  );
}
