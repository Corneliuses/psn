import { useEffect, useState } from 'react';
import { animate } from 'motion/react';

import { duration, easing } from '../motion/presets';

/*
 * Motion-driven count-up. Renders the final value on first paint whenever
 * animation can't or shouldn't run — under reduced motion and in jsdom (no
 * matchMedia) — so tests can assert the final number with no timers. In a real
 * browser that honours motion, it counts up from 0 to `value` using the shared
 * timing tokens.
 */

const defaultFormat = (n: number): string =>
  new Intl.NumberFormat('en-US').format(Math.round(n));

/** True only in a browser that supports and does not suppress motion. */
function canAnimate(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface AnimatedNumberProps {
  value: number;
  /** Formats the (possibly fractional, mid-animation) number for display. */
  format?: (n: number) => string;
  /** Count-up duration in seconds. Defaults to the shared `slow` timing token. */
  durationSec?: number;
}

export function AnimatedNumber({ value, format = defaultFormat, durationSec }: AnimatedNumberProps) {
  // Decide once whether this environment animates. When it doesn't (reduced
  // motion, or jsdom with no matchMedia), we render `value` directly below so
  // the first — and only — paint shows the final number, no timers involved.
  const [animatable] = useState(canAnimate);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!animatable) return;
    const controls = animate(0, value, {
      duration: durationSec ?? duration.slow,
      ease: easing.out,
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [value, animatable, durationSec]);

  const shown = animatable ? display : value;
  return <span className="tabular-nums">{format(shown)}</span>;
}
