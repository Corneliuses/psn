import { comparePlayers } from 'psn/stats';

import { GlassCard } from '../components/GlassCard';
import { MetricScoreboard } from '../components/MetricScoreboard';
import { SharedGamesList } from '../components/SharedGamesList';
import { TrophyTiers } from '../components/TrophyTiers';
import { VsHero } from '../components/VsHero';
import { accentForKey } from '../config/accents';
import { players } from '../config/players';
import { snapshotByKey } from '../data';

/*
 * The head-to-head compare page: the two configured players (in config order)
 * pitted across a VS hero, a clash-meter scoreboard, a trophy-tier block, and a
 * shared-games deep list. Everything is driven by `comparePlayers`; a missing
 * snapshot (or too few configured players) short-circuits to a styled empty state
 * so the comparison is never run on incomplete data.
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
  const playerA = players[0];
  const playerB = players[1];

  if (!playerA || !playerB) {
    return <EmptyState message="Two players need to be configured to compare." />;
  }

  const snapshotA = snapshotByKey(playerA.key);
  const snapshotB = snapshotByKey(playerB.key);

  if (!snapshotA || !snapshotB) {
    return <EmptyState message="Stats for both players need to be synced before they can be compared." />;
  }

  const comparison = comparePlayers(snapshotA, snapshotB);
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
      <SharedGamesList
        sharedGames={comparison.sharedGames}
        nameA={playerA.displayName}
        nameB={playerB.displayName}
        accentA={accentA}
        accentB={accentB}
      />
    </main>
  );
}
