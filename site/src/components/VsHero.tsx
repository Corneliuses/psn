import { motion } from 'motion/react';

import type { PlayerAccent } from '../config/accents';
import { fadeRise, staggerChildren } from '../motion/presets';
import { GlassCard } from './GlassCard';

/*
 * The compare page's hero: the two players facing off across a lightning divider,
 * each name in their own accent color and glow. The whole banner is a single
 * level-1 heading whose accessible name is "<A> versus <B>"; the on-screen names,
 * the VS pill, and the spark bolt are decorative (`aria-hidden`) so assistive tech
 * reads the matchup once, cleanly. Parts enter in a stagger via the shared presets.
 */

export interface VsHeroProps {
  nameA: string;
  nameB: string;
  accentA: PlayerAccent;
  accentB: PlayerAccent;
}

function Player({ name, accent }: { name: string; accent: PlayerAccent }) {
  // A <span> (not a <div>) because this renders inside the <h1>, whose content
  // model is phrasing content only; `flex` still lays the glyph over the name.
  return (
    <motion.span variants={fadeRise} className="flex flex-col items-center gap-1.5">
      <span aria-hidden="true" className={`text-4xl leading-none sm:text-5xl ${accent.text}`}>
        {accent.glyph}
      </span>
      <span
        aria-hidden="true"
        className="text-2xl font-extrabold leading-tight sm:text-3xl"
        style={{ color: accent.colorVar, textShadow: `0 0 22px color-mix(in srgb, ${accent.colorVar} 45%, transparent)` }}
      >
        {name}
      </span>
    </motion.span>
  );
}

export function VsHero({ nameA, nameB, accentA, accentB }: VsHeroProps) {
  return (
    <GlassCard glow className="mb-10 overflow-hidden p-8 sm:p-10">
      <motion.h1
        aria-label={`${nameA} versus ${nameB}`}
        className="grid grid-cols-[1fr_auto_1fr] items-center gap-4"
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
      >
        <Player name={nameA} accent={accentA} />

        <motion.span variants={fadeRise} aria-hidden="true" className="flex flex-col items-center gap-2">
          <span className="block h-7 w-7 text-ps-blue" style={{ filter: 'drop-shadow(0 0 10px var(--color-ps-blue-glow))' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
              <path d="M13.5 1.5 4 13.2c-.3.4 0 .9.5.9h4.4l-1.6 7.9c-.1.6.7.9 1 .4L20 10.5c.3-.4 0-.9-.5-.9h-4.6l1.6-7.7c.1-.6-.7-.9-1-.4z" />
            </svg>
          </span>
          <span className="rounded-pill bg-ps-blue px-3 py-1 text-sm font-extrabold tracking-widest text-foreground shadow-glow">
            VS
          </span>
        </motion.span>

        <Player name={nameB} accent={accentB} />
      </motion.h1>
    </GlassCard>
  );
}
