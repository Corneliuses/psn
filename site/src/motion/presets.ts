import type { Transition, Variants } from 'motion/react';

/*
 * Shared Motion presets for the Design v1 milestone. All later animation work
 * composes these rather than redefining durations/easings inline, so timing and
 * feel stay consistent across the site.
 */

/** Tokenized timing primitives — the single source of truth for motion feel. */
export const duration = {
  fast: 0.18,
  base: 0.32,
  slow: 0.6,
} as const;

/** Easing curves (cubic-bezier control points). */
export const easing = {
  /** Standard ease-out for entrances. */
  out: [0.22, 1, 0.36, 1],
  /** Gentle in-out for looping/ambient motion. */
  inOut: [0.45, 0, 0.55, 1],
} as const;

/** Fade in while rising a few pixels — the default entrance for content blocks. */
export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easing.out },
  },
};

/** Container variant that staggers its children's entrances. */
export const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/** Ambient PS-blue glow pulse for accent/hero elements. */
export const glowPulse: Variants = {
  rest: { boxShadow: '0 0 0 0 rgba(0, 112, 209, 0)' },
  pulse: {
    boxShadow: [
      '0 0 12px 0 rgba(0, 112, 209, 0.25)',
      '0 0 28px 4px rgba(0, 112, 209, 0.5)',
      '0 0 12px 0 rgba(0, 112, 209, 0.25)',
    ],
    transition: {
      duration: duration.slow * 3,
      ease: easing.inOut,
      repeat: Infinity,
    },
  },
};

/** Shared transition presets for one-off use where a full variant is overkill. */
export const transitions = {
  fast: { duration: duration.fast, ease: easing.out } satisfies Transition,
  base: { duration: duration.base, ease: easing.out } satisfies Transition,
  slow: { duration: duration.slow, ease: easing.out } satisfies Transition,
} as const;
