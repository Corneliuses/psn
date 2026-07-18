import { motion } from 'motion/react';
import { formatMinutes } from 'psn/duration';
import type { SharedGameDeepDive, SharedGameLeader } from 'psn/stats';

import type { PlayerAccent } from '../config/accents';
import { fadeRise, staggerChildren } from '../motion/presets';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';

/*
 * The shared-games deep dive: every title both players have played (busiest
 * first, from the data layer), each row showing per-player playtime and trophies
 * plus a summary line with the playtime gap, trophy gap, and who played it more
 * recently. Supersedes the plain SharedGamesList on the compare page. Zero
 * shared games renders a styled empty state rather than an empty list.
 */

function trophyLabel(n: number): string {
  return `${n} ${n === 1 ? 'trophy' : 'trophies'}`;
}

function leaderName(leader: SharedGameLeader, nameA: string, nameB: string): string {
  return leader === 'a' ? nameA : leader === 'b' ? nameB : 'Tie';
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

export interface SharedGamesDeepDiveProps {
  games: SharedGameDeepDive[];
  nameA: string;
  nameB: string;
  accentA: PlayerAccent;
  accentB: PlayerAccent;
  /** Which PS shape accents the header; wraps around △ ○ ✕ □. */
  shapeIndex?: number;
}

export function SharedGamesDeepDive({
  games,
  nameA,
  nameB,
  accentA,
  accentB,
  shapeIndex = 2,
}: SharedGamesDeepDiveProps) {
  return (
    <section className="mb-10">
      <SectionHeader title="Shared games" shapeIndex={shapeIndex} />
      {games.length === 0 ? (
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
          {games.map((game) => (
            <motion.li key={game.name} variants={fadeRise}>
              <GlassCard glow className="p-4">
                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_auto] sm:gap-6">
                  <span className="min-w-0 truncate font-semibold text-foreground">{game.name}</span>
                  <PlayerColumn name={nameA} accent={accentA} playtimeMinutes={game.a.playtimeMinutes} trophiesEarned={game.a.trophiesEarned} />
                  <PlayerColumn name={nameB} accent={accentB} playtimeMinutes={game.b.playtimeMinutes} trophiesEarned={game.b.trophiesEarned} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-border-subtle pt-3 text-sm text-foreground-muted">
                  <span>Playtime gap: <span className="tabular-nums text-foreground">{formatMinutes(game.playtimeGap)}</span></span>
                  <span>Trophy gap: <span className="tabular-nums text-foreground">{game.trophyGap}</span></span>
                  <span>Played more recently: <span className="text-foreground">{leaderName(game.recentlyPlayedBy, nameA, nameB)}</span></span>
                </div>
              </GlassCard>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  );
}
