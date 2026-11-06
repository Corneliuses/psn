import { motion, useReducedMotion } from 'motion/react';
import { useSearchParams } from 'react-router';

import { companions } from '../companions';
import { GameHelpChat, type HelpSuggestion } from '../components/GameHelpChat';
import { GlassCard } from '../components/GlassCard';
import { SparkIcon } from '../components/HelpIcons';
import { glowPulse } from '../motion/presets';

/*
 * Game help: the help desk. A one-line hero with the AI spark, then the chat.
 * The starter questions derive from the companion registry so the games we
 * actually play are one tap away, and `?game=` (set by the "ask about this
 * game" link on a companion app) pre-fills the game field.
 */

/** The query parameter a companion app sets to pre-select its game. */
export const HELP_GAME_PARAM = 'game';

function starterQuestions(): HelpSuggestion[] {
  return companions.map((companion) => ({
    game: companion.name,
    question: `How do I get started in ${companion.name}?`,
  }));
}

export function HelpPage() {
  const [params] = useSearchParams();
  const game = params.get(HELP_GAME_PARAM)?.trim() ?? '';
  const shouldReduceMotion = useReducedMotion();
  // The glow is a box-shadow loop, which <MotionConfig reducedMotion> does not
  // stop, so gate it here; the static shadow-glow-sm stays either way.
  const glowProps = shouldReduceMotion ? {} : ({ variants: glowPulse, initial: 'rest', animate: 'pulse' } as const);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <GlassCard glow className="mb-8 flex items-center gap-5 p-6 sm:p-8">
        <motion.span
          {...glowProps}
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-ps-blue/15 text-ps-blue-text shadow-glow-sm"
        >
          <SparkIcon className="h-8 w-8" />
        </motion.span>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold leading-none text-foreground sm:text-display">Game help</h1>
          <p className="m-0 mt-2 text-foreground-muted">
            Stuck on a boss, a recipe or a trophy? Ask, and get a short answer backed by a guide and a video.
          </p>
        </div>
      </GlassCard>

      <GameHelpChat {...(game ? { initialGame: game } : {})} suggestions={starterQuestions()} />
    </main>
  );
}
