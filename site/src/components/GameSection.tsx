import type { ReactNode } from 'react';
import { motion } from 'motion/react';

import { fadeRise, staggerChildren } from '../motion/presets';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';

/** One normalized row for a game list, regardless of its source stat. */
export interface GameEntry {
  /** Stable key for React lists (titleId or npCommunicationId). */
  id: string;
  iconUrl: string;
  name: string;
  /** The section's relevant metric, pre-formatted for display (text or a badge). */
  metric: ReactNode;
}

export interface GameSectionProps {
  heading: string;
  games: GameEntry[];
  /** Message shown when there are no games in this section. */
  emptyLabel?: string;
  /** Which PS shape accents this section's header; wraps around △ ○ ✕ □. */
  shapeIndex?: number;
}

/**
 * A titled list of games rendered as glass cards: each row is a rounded icon
 * tile, name, and metric with a hover lift + glow, entering in a stagger. The
 * accessible contract is deliberately stable — a level-2 heading (via
 * `SectionHeader`), one `<li>` per game with a decorative empty-alt icon, and an
 * empty-state paragraph — so assistive tech and existing tests see the same
 * semantics the visual redesign sits on top of.
 */
export function GameSection({
  heading,
  games,
  emptyLabel = 'No games yet',
  shapeIndex = 0,
}: GameSectionProps) {
  return (
    <section className="mb-10">
      <SectionHeader title={heading} shapeIndex={shapeIndex} />
      {games.length === 0 ? (
        <p className="text-foreground-muted">{emptyLabel}</p>
      ) : (
        <motion.ul
          className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          {games.map((game) => (
            <motion.li key={game.id} variants={fadeRise}>
              <GlassCard glow className="flex items-center gap-4 p-3">
                {/* Surface tile sits behind the icon so a non-resolving fixture
                    URL shows a neutral square rather than a broken image. */}
                <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2">
                  {/* Decorative: the game name is rendered as adjacent text, so an
                      empty alt keeps assistive tech from announcing it twice. */}
                  <img src={game.iconUrl} alt="" width={48} height={48} className="size-full object-cover" />
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{game.name}</span>
                <span className="shrink-0 text-sm text-foreground-muted">{game.metric}</span>
              </GlassCard>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  );
}
