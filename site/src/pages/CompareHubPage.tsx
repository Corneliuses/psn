import { motion } from 'motion/react';
import { Link } from 'react-router';

import { GlassCard } from '../components/GlassCard';
import { accentForKey } from '../config/accents';
import { fadeRise, staggerChildren } from '../motion/presets';
import { comparePath, playerPairings } from '../routes';

/*
 * The compare hub at /compare: one VS matchup card per pairing of configured
 * players (config order), each linking to that pair's head-to-head page. Names
 * render in their player accents around a VS pill; that treatment is decorative
 * (`aria-hidden`) and the link's accessible name is "Compare <A> and <B>".
 *
 * The names are deliberately large (text-xl, extrabold): the darker shape
 * accents (cross, circle) clear WCAG AA on this surface only as large text.
 */

export function CompareHubPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <GlassCard glow className="mb-10 p-8 sm:p-10">
        <h1 className="text-3xl font-bold leading-none text-foreground sm:text-display">Compare</h1>
        <p className="mt-2 text-foreground-muted">Pick a matchup to see who&rsquo;s ahead, head to head.</p>
      </GlassCard>

      {playerPairings.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-foreground-muted">At least two players need to be configured to compare.</p>
        </GlassCard>
      ) : (
        <motion.ul
          className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          {playerPairings.map(({ a, b }) => {
            const accentA = accentForKey(a.key);
            const accentB = accentForKey(b.key);
            const to = comparePath(a.key, b.key);
            return (
              <motion.li key={to} variants={fadeRise}>
                <GlassCard
                  as={Link}
                  glow
                  to={to}
                  aria-label={`Compare ${a.displayName} and ${b.displayName}`}
                  className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4 p-6 no-underline"
                >
                  <span aria-hidden="true" className="flex flex-col items-center gap-1 text-center">
                    <span className={`text-2xl leading-none ${accentA.text}`}>{accentA.glyph}</span>
                    <span className={`text-xl font-extrabold ${accentA.text}`}>{a.displayName}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="rounded-pill bg-ps-blue px-3 py-1 text-sm font-extrabold tracking-widest text-foreground shadow-glow"
                  >
                    VS
                  </span>
                  <span aria-hidden="true" className="flex flex-col items-center gap-1 text-center">
                    <span className={`text-2xl leading-none ${accentB.text}`}>{accentB.glyph}</span>
                    <span className={`text-xl font-extrabold ${accentB.text}`}>{b.displayName}</span>
                  </span>
                </GlassCard>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </main>
  );
}
