import { CompanionGrid } from '../components/CompanionGrid';
import { GlassCard } from '../components/GlassCard';
import { companions } from '../companions';
import { players } from '../config/players';

/*
 * Together: the companion-apps index. A tile per game we play as a pair, each
 * opening that title's companion app. The page is a thin shell — CompanionGrid
 * owns the tiles and its own empty state.
 */

function playerNamesLabel(): string {
  const names = players.map((player) => player.displayName);
  if (names.length <= 1) return names.join('');
  const last = names[names.length - 1]!;
  return `${names.slice(0, -1).join(', ')} & ${last}`;
}

export function TogetherPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <GlassCard glow className="mb-10 p-8 sm:p-10">
        <h1 className="text-3xl font-bold leading-none text-foreground sm:text-display">Together</h1>
        <p className="mt-2 text-foreground-muted">
          Companion apps for the games {playerNamesLabel()} play side by side &mdash; maps, gear, and
          the notes we keep losing track of.
        </p>
      </GlassCard>
      <CompanionGrid companions={companions} />
    </main>
  );
}
