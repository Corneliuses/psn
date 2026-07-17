import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { duration, easing } from '../motion/presets';

/*
 * Route-level page transition wrapper. App keys one of these per
 * `location.pathname` inside an <AnimatePresence mode="wait">: the outgoing page
 * crossfades out, then the incoming page fades in and rises a few pixels
 * (composing the same feel as `fadeRise`). Under reduced motion the transition
 * collapses to zero duration and the rise is dropped, so the page is committed
 * at full opacity/position on first paint — never parked at a hidden initial
 * state. (MotionConfig reducedMotion="user" already neutralizes the transform
 * rise; gating the opacity here makes the whole transition truly instant.)
 */

export interface RouteTransitionProps {
  children: ReactNode;
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const rise = shouldReduceMotion ? 0 : 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: rise }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -rise }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.base, ease: easing.out }}
    >
      {children}
    </motion.div>
  );
}
