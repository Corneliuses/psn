import { motion, useReducedMotion } from 'motion/react';
import { formatMinutes } from 'psn/duration';
import {
  gamesWithMostTrophies,
  mostPlayedGames,
  platinumGames,
  playerTotals,
  recentGames,
} from 'psn/stats';
import type { PlayerSnapshot } from 'psn';

import { GameSection, type GameEntry } from '../components/GameSection';
import { GlassCard } from '../components/GlassCard';
import { StatTile } from '../components/StatTile';
import { TrophyBadge } from '../components/TrophyBadge';
import { accentForKey } from '../config/accents';
import { playerByKey } from '../config/players';
import { snapshotByKey } from '../data';
import { duration, easing, fadeRise, staggerChildren } from '../motion/presets';
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
        // A known tier renders as a TrophyBadge (per the design system) rather
        // than the word "Platinum"; the badge carries the accessible label.
        metric: (
          <span className="inline-flex items-center gap-2">
            <TrophyBadge tier="platinum" count={1} />
            <span>
              {t.earnedTotal} trophies &middot; {formatDate(t.lastTrophyAt)}
            </span>
          </span>
        ),
      })),
    },
  ];
}

/** Decorative shape glyphs drifting behind the hero title. */
const BACKDROP = [
  { left: '6%', top: '12%', size: '4rem' },
  { left: '78%', top: '18%', size: '5rem' },
  { left: '30%', top: '58%', size: '3.5rem' },
  { left: '90%', top: '64%', size: '3rem' },
] as const;

const BACKDROP_GLYPHS = ['△', '○', '✕', '□'] as const;

function PlayerHero({ playerKey, displayName }: { playerKey: string; displayName: string }) {
  const accent = accentForKey(playerKey);
  const shouldReduceMotion = useReducedMotion();

  return (
    <GlassCard glow className="relative mb-10 overflow-hidden p-8 sm:p-10">
      {/* Decorative drifting glyphs. aria-hidden; the drift (transform) is gated
          on reduced motion so a still viewer sees a static backdrop. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {BACKDROP.map((pos, i) => {
          const driftProps = shouldReduceMotion
            ? {}
            : {
                animate: { y: [0, -10, 0], x: [0, 6, 0] },
                transition: {
                  duration: duration.slow * (5 + i),
                  ease: easing.inOut,
                  repeat: Infinity,
                },
              };
          return (
            <motion.span
              key={i}
              className={`absolute font-bold leading-none opacity-10 ${accent.text}`}
              style={{ left: pos.left, top: pos.top, fontSize: pos.size }}
              {...driftProps}
            >
              {BACKDROP_GLYPHS[i % BACKDROP_GLYPHS.length]}
            </motion.span>
          );
        })}
      </div>

      <motion.div
        className="relative flex items-center gap-4"
        variants={fadeRise}
        initial="hidden"
        animate="visible"
      >
        <span aria-hidden="true" className={`text-3xl leading-none sm:text-display ${accent.text}`}>
          {accent.glyph}
        </span>
        <h1 className="text-3xl font-bold leading-none text-foreground sm:text-display">
          {displayName}
          <span className="text-foreground-muted">&rsquo;s stats</span>
        </h1>
      </motion.div>
    </GlassCard>
  );
}

export function PlayerPage({ playerKey }: PlayerPageProps) {
  const player = playerByKey(playerKey);

  if (!player) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <GlassCard className="p-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Player not found</h1>
          <p className="mt-2 text-foreground-muted">
            No player is configured for &ldquo;{playerKey}&rdquo;.
          </p>
        </GlassCard>
      </main>
    );
  }

  const snapshot = snapshotByKey(playerKey);

  if (!snapshot) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <PlayerHero playerKey={playerKey} displayName={player.displayName} />
        <GlassCard className="p-8 text-center">
          <p className="text-foreground-muted">No stats synced yet.</p>
        </GlassCard>
      </main>
    );
  }

  const totals = playerTotals(snapshot);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <PlayerHero playerKey={playerKey} displayName={player.displayName} />

      <section aria-label="Summary" className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Games played" value={totals.gamesPlayed} />
        <StatTile label="Total trophies" value={totals.trophiesTotal} />
        <StatTile label="Platinums" value={totals.platinums} />
      </section>

      <motion.div variants={staggerChildren} initial="hidden" animate="visible">
        {sectionEntries(snapshot).map((section, i) => (
          <motion.div key={section.heading} variants={fadeRise}>
            <GameSection heading={section.heading} games={section.games} shapeIndex={i} />
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}
