import { motion } from 'motion/react';
import type { SuggestionsFile } from 'psn/suggestions';

import { fadeRise, staggerChildren } from '../motion/presets';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';

/*
 * Discover: unowned games suggested from the top genres both players share,
 * grouped by genre. Each card links out to the game's RAWG page; RAWG's
 * attribution requirement (a backlink on any page using its data) is met by
 * the footer link. Zero shared genres (not yet synced with a RAWG key, or a
 * pair of libraries with no genre overlap) renders a styled empty state.
 */

export interface SuggestionsProps {
  suggestions: SuggestionsFile;
  /** Which PS shape accents the first genre's header; wraps around △ ○ ✕ □. */
  shapeIndex?: number;
}

export function Suggestions({ suggestions, shapeIndex = 0 }: SuggestionsProps) {
  const { by_genre, shared_genres, metadata } = suggestions;
  const genres = shared_genres.filter((genre) => (by_genre[genre]?.length ?? 0) > 0);

  if (genres.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-foreground-muted">
          No suggestions yet &mdash; sync with a RAWG API key to populate this page.
        </p>
      </GlassCard>
    );
  }

  return (
    <div>
      {genres.map((genre, index) => (
        <section key={genre} className="mb-10">
          <SectionHeader title={genre} shapeIndex={shapeIndex + index} />
          <motion.ul
            className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            {by_genre[genre]!.map((game) => (
              <motion.li key={game.rawgId} variants={fadeRise}>
                <GlassCard
                  as="a"
                  glow
                  href={`${metadata.rawg_base_url}/games/${game.rawgId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-4 p-3"
                >
                  <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{game.name}</span>
                  <span className="shrink-0 text-sm text-foreground-muted">
                    {game.rating != null ? game.rating : '—'}
                    {game.released ? ` · ${game.released.slice(0, 4)}` : ''}
                  </span>
                </GlassCard>
              </motion.li>
            ))}
          </motion.ul>
        </section>
      ))}
      <p className="text-sm text-foreground-muted">
        Data from{' '}
        <a
          href={metadata.rawg_base_url}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          RAWG
        </a>
      </p>
    </div>
  );
}
