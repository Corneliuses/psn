import { motion } from 'motion/react';
import type { TrophyPaceInterval } from 'psn/stats';

import { formatDate } from '../format';
import { fadeRise, staggerChildren } from '../motion/presets';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';
import { TrophyBadge, type TrophyTier } from './TrophyBadge';

/*
 * The trophy-pace list: one row per interval between consecutive snapshots,
 * showing the date span and the trophies earned in it as tier badges (highest
 * tier first; only non-empty tiers render). Fewer than two snapshots means no
 * interval, so it shows a styled empty state rather than an empty list. Enters
 * via the shared stagger; each `TrophyBadge` carries its own accessible label.
 */

const TIERS: readonly TrophyTier[] = ['platinum', 'gold', 'silver', 'bronze'];

export interface TrophyPaceListProps {
  intervals: TrophyPaceInterval[];
  /** Which PS shape accents the header; wraps around △ ○ ✕ □. */
  shapeIndex?: number;
}

export function TrophyPaceList({ intervals, shapeIndex = 1 }: TrophyPaceListProps) {
  return (
    <section className="mb-10">
      <SectionHeader title="Trophy pace" shapeIndex={shapeIndex} />
      {intervals.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <p className="text-foreground-muted">
            Trophy pace needs at least two snapshots &mdash; it fills in as history accumulates.
          </p>
        </GlassCard>
      ) : (
        <motion.ul
          className="grid list-none grid-cols-1 gap-3 p-0"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          {intervals.map((interval) => (
            <motion.li key={`${interval.from}-${interval.to}`} variants={fadeRise}>
              <GlassCard glow className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span className="text-sm font-medium text-foreground-muted">
                  {formatDate(interval.from)} <span aria-hidden="true">&rarr;</span>{' '}
                  {formatDate(interval.to)}
                </span>
                <span className="flex items-center gap-3">
                  {interval.total === 0 ? (
                    <span className="text-sm text-foreground-muted">No trophies earned</span>
                  ) : (
                    TIERS.filter((tier) => interval.earned[tier] > 0).map((tier) => (
                      <TrophyBadge key={tier} tier={tier} count={interval.earned[tier]} />
                    ))
                  )}
                </span>
              </GlassCard>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  );
}
