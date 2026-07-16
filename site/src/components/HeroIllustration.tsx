import { motion } from 'motion/react';

import { duration, easing, glowPulse } from '../motion/presets';

/*
 * Custom father-&-son hero illustration for the splash page: two silhouetted
 * players sitting side by side, each holding a controller, on the dark glass
 * surface, with the four abstract PlayStation shapes scattered as confetti
 * accents in the shape token colors. The whole piece is a single image to
 * assistive tech (role="img" + aria-label on the wrapper); the SVG internals are
 * purely decorative (aria-hidden). A subtle idle float plus the shared PS-blue
 * glow pulse compose the motion presets, so both neutralize under reduced motion
 * via the app-level <MotionConfig reducedMotion="user">.
 */

const HERO_LABEL = 'A dad and his son sitting side by side, each holding a game controller';

export function HeroIllustration() {
  return (
    <motion.div
      role="img"
      aria-label={HERO_LABEL}
      className="mx-auto flex w-full max-w-md items-center justify-center rounded-panel border border-border-subtle bg-surface-2 p-6 shadow-panel"
      variants={glowPulse}
      initial="rest"
      animate="pulse"
    >
      <motion.svg
        viewBox="0 0 320 200"
        className="h-auto w-full"
        aria-hidden="true"
        focusable="false"
        // Gentle idle float, composed from the tokenized timing primitives rather
        // than a bespoke keyframe set; disabled automatically under reduced motion.
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: duration.slow * 4, ease: easing.inOut, repeat: Infinity }}
      >
        {/* Confetti accents — the four abstract PlayStation shapes, one per token color. */}
        <polygon points="44,26 58,52 30,52" className="fill-shape-triangle" opacity="0.9" />
        <circle cx="288" cy="38" r="10" className="fill-shape-circle" opacity="0.9" />
        <g className="stroke-shape-cross" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.9">
          <line x1="40" y1="150" x2="58" y2="168" />
          <line x1="58" y1="150" x2="40" y2="168" />
        </g>
        <rect
          x="266"
          y="150"
          width="18"
          height="18"
          rx="3"
          className="fill-shape-square"
          opacity="0.9"
          transform="rotate(18 275 159)"
        />

        {/* Dad — the larger silhouette on the left. */}
        <g className="fill-foreground-muted">
          <circle cx="122" cy="66" r="22" />
          <path d="M92 100c0-16 14-26 30-26s30 10 30 26v60H92z" />
        </g>
        {/* Son — the smaller silhouette, leaning in on the right. */}
        <g className="fill-foreground-muted">
          <circle cx="210" cy="86" r="17" />
          <path d="M187 114c0-13 10-21 23-21s23 8 23 21v46h-46z" />
        </g>

        {/* Controllers each player is holding, in the PS-blue accent. */}
        <rect x="100" y="126" width="46" height="16" rx="7" className="fill-ps-blue" />
        <rect x="184" y="134" width="38" height="13" rx="6" className="fill-ps-blue" />
      </motion.svg>
    </motion.div>
  );
}
