import { motion } from 'motion/react';
import type { Comparison, MetricComparison } from 'psn/stats';

import type { PlayerAccent } from '../config/accents';
import { fadeRise, staggerChildren } from '../motion/presets';
import { ClashMeter } from './ClashMeter';
import type { TrophyTier } from './TrophyBadge';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';

/*
 * The trophy-tier clash meters, in their own block so the four metal tiers read
 * as a distinct group. Each row is the same ClashMeter as the headline board,
 * tinted with the tier's `TrophyBadge` metal color. Rows are selected by metric
 * key and mapped to a tier — note the data layer's platinum metric key is
 * `platinums`.
 */

/** Metric key → trophy tier, in display order (bronze → platinum). */
const TIER_BY_KEY: readonly [string, TrophyTier][] = [
  ['bronze', 'bronze'],
  ['silver', 'silver'],
  ['gold', 'gold'],
  ['platinums', 'platinum'],
];

export interface TrophyTiersProps {
  comparison: Comparison;
  accentA: PlayerAccent;
  accentB: PlayerAccent;
}

export function TrophyTiers({ comparison, accentA, accentB }: TrophyTiersProps) {
  const byKey = new Map<string, MetricComparison>(comparison.metrics.map((m) => [m.metric, m]));
  const rows = TIER_BY_KEY.map(([key, tier]) => {
    const m = byKey.get(key);
    return m ? { m, tier } : undefined;
  }).filter((r): r is { m: MetricComparison; tier: TrophyTier } => r !== undefined);

  return (
    <section className="mb-10">
      <SectionHeader title="Trophy tiers" shapeIndex={1} />
      <GlassCard className="p-5 sm:p-6">
        <motion.div
          className="flex flex-col gap-5"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          {rows.map(({ m, tier }) => (
            <motion.div key={m.metric} variants={fadeRise}>
              <ClashMeter
                label={m.label}
                a={m.a}
                b={m.b}
                winner={m.winner}
                accentA={accentA}
                accentB={accentB}
                tier={tier}
              />
            </motion.div>
          ))}
        </motion.div>
      </GlassCard>
    </section>
  );
}
