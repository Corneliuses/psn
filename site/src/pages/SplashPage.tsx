import { Fragment } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { playerTotals } from 'psn/stats';

import { GlassCard } from '../components/GlassCard';
import { HelpDeskCta } from '../components/HelpDeskCta';
import { HeroIllustration } from '../components/HeroIllustration';
import { PlayerPortalCard } from '../components/PlayerPortalCard';
import { players } from '../config/players';
import { snapshotByKey } from '../data';
import { joinNames } from '../format';
import { fadeRise, staggerChildren } from '../motion/presets';
import { COMPARE_PATH } from '../routes';

/*
 * The splash page is the site's front door: the help-desk call to action up
 * top, a custom hero illustration, an animated headline, one large portal card
 * per configured player (tinted with their accent and showing their trophy
 * tiers), and a family face-off compare call-to-action. The whole page enters
 * in a single staggered sequence (CTA → hero → title → cards → compare)
 * composed from the shared motion presets.
 *
 * Player names are never hardcoded — the headline, portal cards, and compare
 * banner all derive from `players` (config-sourced), so the accessible link/heading
 * contract stays in step with the configured roster. Each portal's trophy counts
 * come from that player's latest snapshot via `playerTotals()`; a player without
 * a snapshot still gets a portal, minus the badges.
 */

/** Display names joined for the headline, e.g. "Dad, Braidan & Nadia". */
const playerNames = joinNames(players.map((player) => player.displayName));
/** Possessive headline lead-in, e.g. "Dad, Braidan & Nadia’s". Empty roster → no dangling possessive. */
const headlineOwner = playerNames ? `${playerNames}’s` : '';

export function SplashPage() {
  return (
    <motion.main
      className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 py-12 text-center"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {/* Help desk CTA — the first thing on the page. */}
      <motion.div variants={fadeRise} className="w-full">
        <HelpDeskCta />
      </motion.div>

      {/* Hero illustration. */}
      <motion.div variants={fadeRise} className="w-full">
        <HeroIllustration />
      </motion.div>

      {/* Animated headline — one <h1> whose words stagger in; the accessible name
          stays the full "<names>'s PlayStation Stats" string. */}
      <motion.h1
        variants={staggerChildren}
        className="text-3xl font-bold tracking-tight text-foreground sm:text-display"
      >
        <motion.span variants={fadeRise} className="block">
          {headlineOwner}
        </motion.span>
        {/* Explicit space so the accessible name reads "…’s PlayStation Stats"
            even where block layout isn't applied (e.g. jsdom). */}{' '}
        <motion.span variants={fadeRise} className="block text-ps-blue">
          PlayStation Stats
        </motion.span>
      </motion.h1>

      {/* Player portal cards — one large accent-tinted glass card per configured
          player. Two columns on small screens, three on large; at the two-column
          breakpoint an odd last card spans the full row so it never sits orphaned. */}
      <motion.ul
        variants={staggerChildren}
        className="grid w-full list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3"
      >
        {players.map((player) => {
          const snapshot = snapshotByKey(player.key);
          return (
            <motion.li
              key={player.key}
              variants={fadeRise}
              className="sm:last:odd:col-span-2 lg:last:odd:col-span-1"
            >
              <PlayerPortalCard player={player} {...(snapshot ? { totals: playerTotals(snapshot) } : {})} />
            </motion.li>
          );
        })}
      </motion.ul>

      {/* Compare CTA — a family face-off banner: every configured player's name
          with a VS pill between each pair. The names, pills, and eyebrow are a
          decorative treatment; the link's accessible name is exactly "Compare". */}
      <motion.div variants={fadeRise} className="w-full">
        <GlassCard
          as={Link}
          to={COMPARE_PATH}
          glow
          aria-label="Compare"
          className="mx-auto flex max-w-xl flex-col items-center gap-3 p-6 no-underline"
        >
          <span
            aria-hidden="true"
            className="text-sm font-semibold uppercase tracking-widest text-foreground-muted"
          >
            Family face-off
          </span>
          <span aria-hidden="true" className="flex flex-wrap items-center justify-center gap-3">
            {players.map((player, index) => (
              <Fragment key={player.key}>
                {index > 0 && (
                  <span className="rounded-pill bg-ps-blue px-3 py-1 text-sm font-bold tracking-widest text-foreground">
                    VS
                  </span>
                )}
                <span className="text-lg font-semibold text-foreground">{player.displayName}</span>
              </Fragment>
            ))}
          </span>
        </GlassCard>
      </motion.div>
    </motion.main>
  );
}
