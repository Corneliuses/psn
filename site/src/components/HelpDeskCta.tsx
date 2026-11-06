import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';

import { glowPulse, transitions } from '../motion/presets';
import { HELP_PATH } from '../routes';
import { SparkIcon } from './HelpIcons';

/*
 * The big front-door call to action for the game help desk: a pill button in
 * the accessible PS-blue fill with the AI spark, pulsing the shared glow (gated
 * on reduced motion, since <MotionConfig> only neutralizes transform motion),
 * and a press/hover scale from the shared transitions. The link's accessible
 * name is exactly "Get help with your game"; the arrow and spark are decorative
 * and the supporting line sits outside the link.
 */

const LABEL = 'Get help with your game';

export function HelpDeskCta() {
  const shouldReduceMotion = useReducedMotion();
  const glowProps = shouldReduceMotion ? {} : ({ variants: glowPulse, initial: 'rest', animate: 'pulse' } as const);
  const pressProps = shouldReduceMotion ? {} : { whileHover: { scale: 1.03 }, whileTap: { scale: 0.98 } };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <motion.div {...glowProps} {...pressProps} transition={transitions.fast} className="rounded-pill">
        <Link
          to={HELP_PATH}
          className="inline-flex items-center gap-3 rounded-pill bg-ps-blue-fill px-7 py-4 text-xl font-extrabold tracking-tight text-foreground no-underline transition-colors hover:bg-ps-blue-fill-hover sm:px-10 sm:py-5 sm:text-2xl"
        >
          <SparkIcon className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
          {LABEL}
          <span aria-hidden="true" className="text-2xl leading-none sm:text-3xl">
            →
          </span>
        </Link>
      </motion.div>
      <p className="m-0 text-sm text-foreground-muted sm:text-base">
        Stuck on a boss, a recipe or a trophy? Ask the help desk and get an answer backed by a guide and a video.
      </p>
    </div>
  );
}
