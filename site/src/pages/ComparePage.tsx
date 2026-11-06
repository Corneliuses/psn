import { comparePlayers, sharedGamesDeepDive } from 'psn/stats';
import { useParams } from 'react-router';

import { GlassCard } from '../components/GlassCard';
import { MetricScoreboard } from '../components/MetricScoreboard';
import { SharedGamesDeepDive } from '../components/SharedGamesDeepDive';
import { TrophyTiers } from '../components/TrophyTiers';
import { VsHero } from '../components/VsHero';
import { accentForKey } from '../config/accents';
import { playerByKey } from '../config/players';
import { snapshotByKey } from '../data';
import { NotFoundPage } from './NotFoundPage';

/*
 * The head-to-head compare page for any pair, routed at /compare/:a/:b: the two
 * players named by the route params pitted across a VS hero, a clash-meter
 * scoreboard, a trophy-tier block, and a shared-games deep list. Everything is driven by `comparePlayers`; a missing
 * snapshot short-circuits to a styled empty state naming the pair, so the
 * comparison is never run on incomplete data. An unknown or missing key, or a
 * player compared against themselves, renders the shared 404.
 */

function EmptyState({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <GlassCard className="p-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Compare</h1>
        <p className="mt-2 text-foreground-muted">{message}</p>
      </GlassCard>
    </main>
  );
}

export function ComparePage() {
  const { a, b } = useParams();
  const playerA = a ? playerByKey(a) : undefined;
  const playerB = b ? playerByKey(b) : undefined;

  if (!playerA || !playerB || playerA.key === playerB.key) {
    return <NotFoundPage />;
  }

  const snapshotA = snapshotByKey(playerA.key);
  const snapshotB = snapshotByKey(playerB.key);

  if (!snapshotA || !snapshotB) {
    return (
      <EmptyState
        message={`Stats for ${playerA.displayName} and ${playerB.displayName} need to be synced before they can be compared.`}
      />
    );
  }

  const comparison = comparePlayers(snapshotA, snapshotB);
  const deepDive = sharedGamesDeepDive(snapshotA, snapshotB);
  const accentA = accentForKey(playerA.key);
  const accentB = accentForKey(playerB.key);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <VsHero
        nameA={playerA.displayName}
        nameB={playerB.displayName}
        accentA={accentA}
        accentB={accentB}
      />
      <MetricScoreboard comparison={comparison} accentA={accentA} accentB={accentB} />
      <TrophyTiers comparison={comparison} accentA={accentA} accentB={accentB} />
      <SharedGamesDeepDive
        games={deepDive}
        nameA={playerA.displayName}
        nameB={playerB.displayName}
        accentA={accentA}
        accentB={accentB}
      />
    </main>
  );
}
