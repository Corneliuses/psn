import { motion } from 'motion/react';
import { Link } from 'react-router';

import { GlassCard } from '../components/GlassCard';
import { HeroIllustration } from '../components/HeroIllustration';
import { players } from '../config/players';
import { fadeRise, staggerChildren } from '../motion/presets';
import { COMPARE_PATH, playerPath } from '../routes';

/*
 * The splash page is the site's front door: a custom hero illustration, an
 * animated headline, one large portal card per configured player, and a
 * VS-styled compare call-to-action. The whole page enters in a single staggered
 * sequence (hero → title → cards → CTA) composed from the shared motion presets.
 *
 * Player names are never hardcoded — the headline, portal cards, and compare
 * banner all derive from `players` (config-sourced), so the accessible link/heading
 * contract stays in step with the configured roster.
 */

/** Display names joined for the headline, e.g. "Dad & Braidan". */
const playerNames = players.map((player) => player.displayName).join(' & ');
/** Possessive headline lead-in, e.g. "Dad & Braidan’s". Empty roster → no dangling possessive. */
const headlineOwner = playerNames ? `${playerNames}’s` : '';

/** Derive a per-player invitation line from the display name — no config field needed. */
function invitationLine(displayName: string): string {
  return `Explore ${displayName}’s trophies & playtime`;
}

export function SplashPage() {
  return (
    <motion.main
      className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 py-12 text-center"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
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
        <motion.span variants={fadeRise} className="block text-ps-blue">
          PlayStation Stats
        </motion.span>
      </motion.h1>

      {/* Player portal cards — one large glass card per configured player. */}
      <motion.ul
        variants={staggerChildren}
        className="grid w-full list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2"
      >
        {players.map((player) => (
          <motion.li key={player.key} variants={fadeRise}>
            <GlassCard
              as={Link}
              to={playerPath(player.key)}
              glow
              className="flex h-full flex-col items-center gap-2 p-8 text-center no-underline"
            >
              <span className="text-2xl font-bold text-foreground">{player.displayName}</span>
              <span className="text-foreground-muted">{invitationLine(player.displayName)}</span>
            </GlassCard>
          </motion.li>
        ))}
      </motion.ul>

      {/* Compare CTA — a VS banner. The names + "VS" are a decorative treatment;
          the link's accessible name is exactly "Compare". */}
      <motion.div variants={fadeRise} className="w-full">
        <GlassCard
          as={Link}
          to={COMPARE_PATH}
          glow
          aria-label="Compare"
          className="mx-auto flex max-w-md items-center justify-center gap-4 p-6 no-underline"
        >
          <span aria-hidden="true" className="text-lg font-semibold text-foreground">
            {players[0]?.displayName}
          </span>
          <span
            aria-hidden="true"
            className="rounded-pill bg-ps-blue px-3 py-1 text-sm font-bold tracking-widest text-foreground"
          >
            VS
          </span>
          <span aria-hidden="true" className="text-lg font-semibold text-foreground">
            {players[1]?.displayName}
          </span>
        </GlassCard>
      </motion.div>
    </motion.main>
  );
}
