import { players } from './players';

/**
 * A per-player accent drawn from the decorative PlayStation shape tokens
 * (theme.css `--color-shape-*`). Accents are assigned by a player's position in
 * `players` (config order), wrapping past the last shape — never hardcoded per
 * key — so adding or reordering players in psn.config.json reshuffles accents
 * without touching this file. `ps-blue` stays the global brand accent; these
 * differentiate individual players.
 */

export interface PlayerAccent {
  /** The shape glyph used in the hero backdrop. */
  glyph: string;
  /** Tailwind text-color utility for the accent (e.g. `text-shape-circle`). */
  text: string;
  /** Tailwind fill-color utility for SVG/backdrop use (e.g. `fill-shape-circle`). */
  fill: string;
  /**
   * The raw accent color as a CSS value (the theme custom property), for inline
   * use where a Tailwind utility can't express it — proportional bar fills and
   * accent-colored glows on the compare page, where the color has to be composed
   * into a gradient / box-shadow at runtime.
   */
  colorVar: string;
}

const ACCENTS: readonly PlayerAccent[] = [
  { glyph: '△', text: 'text-shape-triangle', fill: 'fill-shape-triangle', colorVar: 'var(--color-shape-triangle)' },
  { glyph: '○', text: 'text-shape-circle', fill: 'fill-shape-circle', colorVar: 'var(--color-shape-circle)' },
  { glyph: '✕', text: 'text-shape-cross', fill: 'fill-shape-cross', colorVar: 'var(--color-shape-cross)' },
  { glyph: '□', text: 'text-shape-square', fill: 'fill-shape-square', colorVar: 'var(--color-shape-square)' },
] as const;

/** The accent for a player key, by config order. Unknown keys fall back to the first accent. */
export function accentForKey(key: string): PlayerAccent {
  const index = players.findIndex((player) => player.key === key);
  const i = index < 0 ? 0 : index % ACCENTS.length;
  return ACCENTS[i]!;
}
