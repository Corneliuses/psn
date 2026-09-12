import { motion } from 'motion/react';
import { Link } from 'react-router';

import type { Companion } from '../companions/types';
import { fadeRise, staggerChildren } from '../motion/presets';
import { companionPath } from '../routes';
import { GlassCard } from './GlassCard';

/*
 * The tile grid on /together: one tile per game we play as a pair, each linking
 * into its companion app. Tiles are text-and-shape only — no box art, per the
 * repo's no-trademarked-assets rule — so the decorative shape glyph plus the
 * game's own name does the identifying.
 *
 * The module list on each tile tells you what's actually inside before you tap.
 */

const SHAPES = ['△', '○', '✕', '□'] as const;
const SHAPE_COLORS = [
  'text-shape-triangle',
  'text-shape-circle',
  'text-shape-cross',
  'text-shape-square',
] as const;

/** Human labels for the modules a companion has, in page order. */
function moduleLabels(companion: Companion): string[] {
  const labels: string[] = [];
  if (companion.quickReference?.length) labels.push('Quick reference');
  if (companion.map) labels.push('Map');
  if (companion.guides?.length) labels.push('Guides');
  if (companion.links?.length) labels.push('Help sites');
  if (companion.videos?.length) labels.push('Videos');
  if (companion.notes?.length) labels.push('Notes');
  return labels;
}

export interface CompanionGridProps {
  companions: Companion[];
}

export function CompanionGrid({ companions }: CompanionGridProps) {
  if (companions.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-foreground-muted">
          No companion apps yet &mdash; the first title lands here once it&rsquo;s added.
        </p>
      </GlassCard>
    );
  }

  return (
    <motion.ul
      className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {companions.map((companion, index) => {
        const i = index % SHAPES.length;
        return (
          <motion.li key={companion.slug} variants={fadeRise}>
            <GlassCard as={Link} glow to={companionPath(companion.slug)} className="flex h-full flex-col p-6">
              <span aria-hidden="true" className={`text-2xl leading-none ${SHAPE_COLORS[i]}`}>
                {SHAPES[i]}
              </span>
              <span className="mt-3 text-xl font-bold text-foreground">{companion.name}</span>
              <span className="mt-1 text-sm text-foreground-muted">{companion.tagline}</span>
              <span className="mt-4 flex flex-wrap gap-1.5">
                {moduleLabels(companion).map((label) => (
                  <span
                    key={label}
                    className="rounded-pill border border-border-subtle px-2 py-0.5 text-xs font-medium text-foreground-muted"
                  >
                    {label}
                  </span>
                ))}
              </span>
            </GlassCard>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
