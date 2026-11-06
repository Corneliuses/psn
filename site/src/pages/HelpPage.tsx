import { useSearchParams } from 'react-router';

import { companions } from '../companions';
import { GameHelpChat, type HelpSuggestion } from '../components/GameHelpChat';
import { GlassCard } from '../components/GlassCard';
import { SectionHeader } from '../components/SectionHeader';

/*
 * Help: the game help desk. A hero that says what the bot will and won't do,
 * then the chat. The starter questions derive from the companion registry so
 * the games we actually play are one tap away, and `?game=` (set by the "ask
 * about this game" link on a companion app) pre-fills the game field.
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <GlassCard glow className="mb-10 p-8 sm:p-10">
        <h1 className="text-3xl font-bold leading-none text-foreground sm:text-display">Help desk</h1>
        <p className="mt-2 text-foreground-muted">
          Stuck in a game? Ask how to do it and get a short answer with a written guide and a video to back
          it up. It only talks about playing games &mdash; everything else gets a polite no.
        </p>
      </GlassCard>

      <section>
        <SectionHeader title="Ask the help desk" />
        <GameHelpChat {...(game ? { initialGame: game } : {})} suggestions={starterQuestions()} />
      </section>
    </main>
  );
}
