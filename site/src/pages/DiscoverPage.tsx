import { GlassCard } from '../components/GlassCard';
import { Suggestions } from '../components/Suggestions';
import { players } from '../config/players';
import { suggestionsData } from '../data';

/*
 * Discover: unowned games suggested from the genres both players share most,
 * refreshed at sync time (see src/suggestions/). The page is a thin shell —
 * Suggestions itself renders the empty state when no shared genres exist yet.
 */

function playerNamesLabel(): string {
  const names = players.map((player) => player.displayName);
  if (names.length <= 1) return names.join('');
  const last = names[names.length - 1]!;
  return `${names.slice(0, -1).join(', ')} & ${last}`;
}

export function DiscoverPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <GlassCard glow className="mb-10 p-8 sm:p-10">
        <h1 className="text-3xl font-bold leading-none text-foreground sm:text-display">Discover</h1>
        <p className="mt-2 text-foreground-muted">
          Unowned games picked from the genres {playerNamesLabel()} both play most.
        </p>
      </GlassCard>
      <Suggestions suggestions={suggestionsData()} />
    </main>
  );
}
