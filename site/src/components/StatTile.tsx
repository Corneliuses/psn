import { motion } from 'motion/react';

import { fadeRise } from '../motion/presets';
import { AnimatedNumber } from './AnimatedNumber';
import { GlassCard } from './GlassCard';

/*
 * A headline metric card: a large count-up number over a muted caption, on the
 * shared glass surface. Enters via the shared `fadeRise` preset. The number
 * animates through AnimatedNumber, which is safe under reduced motion and jsdom.
 */

export interface StatTileProps {
  label: string;
  value: number;
  /** Formats the metric (e.g. add a unit). Passed through to AnimatedNumber. */
  format?: (n: number) => string;
}

export function StatTile({ label, value, format }: StatTileProps) {
  return (
    <motion.div variants={fadeRise} initial="hidden" animate="visible">
      <GlassCard glow className="flex flex-col gap-1 p-5">
        <span className="text-display font-bold leading-none text-foreground">
          <AnimatedNumber value={value} {...(format ? { format } : {})} />
        </span>
        <span className="text-sm font-medium uppercase tracking-wide text-foreground-muted">
          {label}
        </span>
      </GlassCard>
    </motion.div>
  );
}
