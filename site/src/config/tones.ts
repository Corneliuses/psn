import type { CompanionTone } from '../companions/types';

/**
 * Companion content names a colour *role* (`resource`, `creature`, …) and this
 * maps it to the decorative shape tokens in theme.css — so a content file never
 * names a colour and the palette stays centrally editable. Same idea as
 * `accents.ts` for players, but keyed by meaning rather than config order.
 *
 * These are the decorative shape tokens, never the trophy metals (which are
 * reserved for trophy data).
 */
export interface ToneStyle {
  /** Tailwind text-color utility, e.g. `text-shape-triangle`. */
  text: string;
  /** Tailwind border-color utility. */
  border: string;
  /**
   * The raw token as a CSS value, for inline use where a utility can't reach —
   * map zone fills and pin dots composed at runtime.
   */
  colorVar: string;
}

const TONES: Record<CompanionTone, ToneStyle> = {
  resource: {
    text: 'text-shape-triangle',
    border: 'border-shape-triangle',
    colorVar: 'var(--color-shape-triangle)',
  },
  creature: {
    text: 'text-shape-circle',
    border: 'border-shape-circle',
    colorVar: 'var(--color-shape-circle)',
  },
  landmark: {
    text: 'text-shape-cross',
    border: 'border-shape-cross',
    colorVar: 'var(--color-shape-cross)',
  },
  base: {
    text: 'text-shape-square',
    border: 'border-shape-square',
    colorVar: 'var(--color-shape-square)',
  },
};

export function toneStyle(tone: CompanionTone): ToneStyle {
  return TONES[tone];
}
