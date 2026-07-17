import { motion } from 'motion/react';
import { formatMinutes } from 'psn/duration';
import type { SharedGame } from 'psn/stats';

import type { PlayerAccent } from '../config/accents';
import { fadeRise, staggerChildren } from '../motion/presets';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';

/*
 * The shared-games deep list: every title both players have played, already
 * sorted by combined playtime in the data layer. Each row shows the game name
 * and, per player, their playtime (`formatMinutes`) and trophies earned, on the
 * shared glass surface. Zero shared games renders a styled empty state rather
 * than an empty list.
 */

function trophyLabel(n: number): string {
  return `${n} ${n === 1 ? 'trophy' : 'trophies'}`;
}

function PlayerColumn({ name, accent, playtimeMinutes, trophiesEarned }: {
  name: string;
  accent: PlayerAccent;
  playtimeMinutes: number;
  trophiesEarned: number;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 sm:items-end sm:text-right">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: accent.colorVar }} />
        {name}
      </span>
      <span className="font-semibold tabular-nums text-foreground">{formatMinutes(playtimeMinutes)}</span>
      <span className="text-sm tabular-nums text-foreground-muted">{trophyLabel(trophiesEarned)}</span>
    </div>
  );
}

export interface SharedGamesListProps {
  sharedGames: SharedGame[];
  nameA: string;
  nameB: string;
  accentA: PlayerAccent;
  accentB: PlayerAccent;
}

export function SharedGamesList({ sharedGames, nameA, nameB, accentA, accentB }: SharedGamesListProps) {
  return (
    <section className="mb-10">
      <SectionHeader title="Shared games" shapeIndex={2} />
      {sharedGames.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-foreground-muted">
            No shared games yet &mdash; {nameA} and {nameB} haven&rsquo;t played the same titles.
          </p>
        </GlassCard>
      ) : (
        <motion.ul
          className="grid list-none grid-cols-1 gap-3 p-0"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          {sharedGames.map((game) => (
            <motion.li key={game.name} variants={fadeRise}>
              <GlassCard glow className="grid grid-cols-1 items-center gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:gap-6">
                <span className="min-w-0 truncate font-semibold text-foreground">{game.name}</span>
                <PlayerColumn name={nameA} accent={accentA} playtimeMinutes={game.a.playtimeMinutes} trophiesEarned={game.a.trophiesEarned} />
                <PlayerColumn name={nameB} accent={accentB} playtimeMinutes={game.b.playtimeMinutes} trophiesEarned={game.b.trophiesEarned} />
              </GlassCard>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  );
}
