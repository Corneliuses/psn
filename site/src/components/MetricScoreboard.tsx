import { motion } from 'motion/react';
import { formatMinutes } from 'psn/duration';
import type { Comparison, MetricComparison } from 'psn/stats';

import type { PlayerAccent } from '../config/accents';
import { fadeRise, staggerChildren } from '../motion/presets';
import { ClashMeter } from './ClashMeter';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';

/*
 * The headline head-to-head scoreboard: the top-line metrics rendered as clash
 * meters. Rows are selected from `comparison.metrics` by metric *key* (not array
 * index), so the grouping stays correct even if the data layer reorders the
 * metrics array. Total play time is formatted with `formatMinutes`; the rest are
 * plain counts. The always-tied "shared games" count rides along here as a
 * natural neutral row.
 */

/**
 * Format minutes for the play-time row. Rounds first because AnimatedNumber feeds
 * fractional, mid-count-up values through here, and `formatMinutes` would other-
 * wise render a long fractional remainder (e.g. "63h 39.1834m") until the tween
 * lands.
 */
function formatPlaytime(minutes: number): string {
  return formatMinutes(Math.round(minutes));
}

/** Headline metric keys, in the order they should appear. */
const HEADLINE_KEYS = ['playtimeMinutes', 'gamesPlayed', 'trophiesTotal', 'sharedGames'] as const;

export interface MetricScoreboardProps {
  comparison: Comparison;
  accentA: PlayerAccent;
  accentB: PlayerAccent;
}

export function MetricScoreboard({ comparison, accentA, accentB }: MetricScoreboardProps) {
  const byKey = new Map<string, MetricComparison>(comparison.metrics.map((m) => [m.metric, m]));
  const rows = HEADLINE_KEYS.map((key) => byKey.get(key)).filter(
    (m): m is MetricComparison => m !== undefined,
  );

  return (
    <section className="mb-10">
      <SectionHeader title="Head to head" shapeIndex={0} />
      <GlassCard className="p-5 sm:p-6">
        <motion.div
          className="flex flex-col gap-5"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          {rows.map((m) => (
            <motion.div key={m.metric} variants={fadeRise}>
              <ClashMeter
                label={m.label}
                a={m.a}
                b={m.b}
                winner={m.winner}
                accentA={accentA}
                accentB={accentB}
                {...(m.metric === 'playtimeMinutes' ? { format: formatPlaytime } : {})}
              />
            </motion.div>
          ))}
        </motion.div>
      </GlassCard>
    </section>
  );
}
