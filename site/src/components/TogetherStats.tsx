import { motion } from 'motion/react';
import { formatMinutes } from 'psn/duration';
import type { TitleStats } from 'psn/stats';

import type { PlayerAccent } from '../config/accents';
import { formatDate } from '../format';
import { fadeRise, staggerChildren } from '../motion/presets';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';
import { StatTile } from './StatTile';

/*
 * The one companion module that isn't hand-written content: what the synced
 * snapshots already know about this game. Combined playtime up top, then a card
 * per player with their own playtime, trophies and last session.
 *
 * A player with no entry for the title (never launched it) renders an explicit
 * "not in this library yet" card rather than a row of zeroes, so the page never
 * implies someone played a game they haven't.
 */

export interface TogetherStatsEntry {
  playerKey: string;
  displayName: string;
  accent: PlayerAccent;
  /** Undefined when the game isn't in this player's snapshot at all. */
  stats: TitleStats | undefined;
}

export interface TogetherStatsProps {
  entries: TogetherStatsEntry[];
  /** Which PS shape accents the section header; wraps around △ ○ ✕ □. */
  shapeIndex?: number;
}

export function TogetherStats({ entries, shapeIndex = 0 }: TogetherStatsProps) {
  const played = entries.filter((entry) => entry.stats);
  const combinedMinutes = played.reduce((sum, entry) => sum + (entry.stats?.playtimeMinutes ?? 0), 0);
  const combinedTrophies = played.reduce((sum, entry) => sum + (entry.stats?.trophiesEarned ?? 0), 0);

  return (
    <section className="mb-10">
      <SectionHeader title="Our time in this one" shapeIndex={shapeIndex} />

      {played.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-foreground-muted">
            Neither of us has played this yet &mdash; stats appear after the next sync.
          </p>
        </GlassCard>
      ) : (
        <>
          <motion.div
            className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            <StatTile label="Combined playtime" value={combinedMinutes} format={formatMinutes} />
            <StatTile label="Trophies between us" value={combinedTrophies} />
          </motion.div>

          <motion.ul
            className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            {entries.map((entry) => (
              <motion.li key={entry.playerKey} variants={fadeRise}>
                <GlassCard className="h-full p-5">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <span aria-hidden="true" className={entry.accent.text}>
                      {entry.accent.glyph}
                    </span>
                    {entry.displayName}
                  </h3>
                  {entry.stats ? (
                    <dl className="m-0 mt-3 flex flex-col gap-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-foreground-muted">Playtime</dt>
                        <dd className="m-0 font-semibold tabular-nums text-foreground">
                          {formatMinutes(entry.stats.playtimeMinutes)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-foreground-muted">Trophies</dt>
                        <dd className="m-0 font-semibold tabular-nums text-foreground">
                          {entry.stats.trophiesDefined > 0
                            ? `${entry.stats.trophiesEarned} of ${entry.stats.trophiesDefined}`
                            : entry.stats.trophiesEarned}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-foreground-muted">Sessions</dt>
                        <dd className="m-0 font-semibold tabular-nums text-foreground">{entry.stats.playCount}</dd>
                      </div>
                      {entry.stats.lastPlayed ? (
                        <div className="flex justify-between gap-4">
                          <dt className="text-foreground-muted">Last played</dt>
                          <dd className="m-0 font-semibold tabular-nums text-foreground">
                            {formatDate(entry.stats.lastPlayed)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-foreground-muted">Not in this library yet.</p>
                  )}
                </GlassCard>
              </motion.li>
            ))}
          </motion.ul>
        </>
      )}
    </section>
  );
}
