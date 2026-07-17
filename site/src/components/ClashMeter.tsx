import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

import type { PlayerAccent } from '../config/accents';
import { duration, easing } from '../motion/presets';
import { AnimatedNumber } from './AnimatedNumber';
import type { TrophyTier } from './TrophyBadge';

/*
 * One head-to-head metric rendered as a "clash meter": a single contested track
 * split proportionally between the two players, with a glowing lightning seam
 * sitting on the division. The winning side (driven by `winner`, not by the
 * seam position, so near-ties still read correctly) saturates and glows in that
 * player's accent; the loser eases back gently. Ties centre the seam with a
 * neutral treatment — which also covers the always-tied shared-games count and
 * any zero/zero row (`a + b === 0` → centred, no divide-by-zero).
 *
 * The seam slides out from centre on entrance, but renders at its final position
 * immediately whenever animation can't/shouldn't run (reduced motion, jsdom) —
 * the same gate `AnimatedNumber` uses — so the values (the assertable source of
 * truth) and the final layout are present on the first and only paint in tests.
 */

const TIER_TEXT: Record<TrophyTier, string> = {
  bronze: 'text-trophy-bronze',
  silver: 'text-trophy-silver',
  gold: 'text-trophy-gold',
  platinum: 'text-trophy-platinum',
};

/** True only in a browser that supports and does not suppress motion. */
function canAnimate(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const EASE = `cubic-bezier(${easing.out.join(',')})`;

/** A translucent version of an accent color, for glows and gradient tails. */
function alpha(colorVar: string, pct: number): string {
  return `color-mix(in srgb, ${colorVar} ${pct}%, transparent)`;
}

export interface ClashMeterProps {
  label: string;
  a: number;
  b: number;
  winner: 'a' | 'b' | 'tie';
  /** Left player's accent. */
  accentA: PlayerAccent;
  /** Right player's accent. */
  accentB: PlayerAccent;
  /** Formats both values (e.g. `formatMinutes`). Defaults to a localized integer. */
  format?: (n: number) => string;
  /** When set, tints the label with the trophy metal color and shows a metal disc. */
  tier?: TrophyTier;
}

export function ClashMeter({ label, a, b, winner, accentA, accentB, format, tier }: ClashMeterProps) {
  // Player A's share of the track, in [0, 1]. Both zero → centred (no divide-by-zero).
  const share = a + b === 0 ? 0.5 : a / (a + b);

  const [animatable] = useState(canAnimate);
  const [pos, setPos] = useState(animatable ? 0.5 : share);

  useEffect(() => {
    if (!animatable) return;
    // Next frame: move from centre to the real split so the CSS transition runs.
    const id = requestAnimationFrame(() => setPos(share));
    return () => cancelAnimationFrame(id);
  }, [animatable, share]);

  const aPct = `${(pos * 100).toFixed(2)}%`;
  const bPct = `${((1 - pos) * 100).toFixed(2)}%`;
  const barTransition = animatable ? `width ${duration.slow}s ${EASE}` : undefined;
  const seamTransition = animatable ? `left ${duration.slow}s ${EASE}` : undefined;

  const seamColor = winner === 'a' ? accentA.colorVar : winner === 'b' ? accentB.colorVar : 'var(--color-foreground)';

  const sideStyle = (side: 'a' | 'b'): CSSProperties => {
    const accent = side === 'a' ? accentA : accentB;
    const isWinner = winner === side;
    // Fade the accent toward the outer edge; full saturation meets at the seam.
    const stops = side === 'a'
      ? `${alpha(accent.colorVar, 40)}, ${accent.colorVar}`
      : `${accent.colorVar}, ${alpha(accent.colorVar, 40)}`;
    return {
      width: side === 'a' ? aPct : bPct,
      background: `linear-gradient(90deg, ${stops})`,
      transition: barTransition,
      opacity: isWinner ? 1 : 0.62,
      boxShadow: isWinner ? `0 0 16px 0 ${alpha(accent.colorVar, 55)}` : undefined,
    };
  };

  const valueClass = (side: 'a' | 'b'): string =>
    `font-bold tabular-nums transition-all ${
      winner === side ? 'text-2xl' : 'text-lg text-foreground-muted'
    }`;

  const valueStyle = (side: 'a' | 'b'): CSSProperties | undefined => {
    if (winner !== side) return undefined;
    const accent = side === 'a' ? accentA : accentB;
    return { color: accent.colorVar, textShadow: `0 0 18px ${alpha(accent.colorVar, 55)}` };
  };

  return (
    <div data-winner={winner} className="flex flex-col gap-2">
      <div
        className={`flex items-center justify-center gap-2 text-center text-xs font-medium uppercase tracking-wide ${
          tier ? TIER_TEXT[tier] : 'text-foreground-muted'
        }`}
      >
        {tier ? (
          <span aria-hidden="true" className="text-[0.7rem] leading-none">
            ●
          </span>
        ) : null}
        <span>{label}</span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className={valueClass('a')} style={valueStyle('a')}>
          <AnimatedNumber value={a} {...(format ? { format } : {})} />
        </span>
        <span className={valueClass('b')} style={valueStyle('b')}>
          <AnimatedNumber value={b} {...(format ? { format } : {})} />
        </span>
      </div>

      {/* The track encodes proportion redundantly with the numbers above, so it's
          decorative to assistive tech; the values carry the meaning. */}
      <div
        aria-hidden="true"
        className="relative flex h-3.5 overflow-visible rounded-pill bg-white/5 shadow-[inset_0_0_0_1px_var(--color-border-subtle)]"
      >
        <div className="h-full rounded-l-pill" style={sideStyle('a')} />
        <div className="h-full rounded-r-pill" style={sideStyle('b')} />

        <div
          className="pointer-events-none absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          style={{ left: aPct, transition: seamTransition }}
        >
          <span
            className="absolute -top-2 -bottom-2 w-[3px] rounded"
            style={{ background: seamColor, boxShadow: `0 0 16px 2px ${alpha(seamColor, winner === 'tie' ? 35 : 55)}` }}
          />
          <span
            className="absolute h-6 w-6 rounded-full"
            style={{ background: `radial-gradient(circle, ${alpha(seamColor, 55)}, transparent 68%)` }}
          />
          <span
            className="relative block h-5 w-5 text-white motion-safe:animate-flicker"
            style={{ filter: `drop-shadow(0 0 8px ${seamColor})` }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
              <path d="M13.5 1.5 4 13.2c-.3.4 0 .9.5.9h4.4l-1.6 7.9c-.1.6.7.9 1 .4L20 10.5c.3-.4 0-.9-.5-.9h-4.6l1.6-7.7c.1-.6-.7-.9-1-.4z" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
