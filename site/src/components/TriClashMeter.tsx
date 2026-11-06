import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

import type { PlayerAccent } from '../config/accents';
import { duration, easing } from '../motion/presets';
import { AnimatedNumber } from './AnimatedNumber';
import type { TrophyTier } from './TrophyBadge';

/*
 * One roster-wide metric rendered as a multi-way "clash meter": a single track
 * split into one proportional segment per player (built for three, generic over
 * the roster), with a glowing lightning seam at every division. It extends the
 * two-way `ClashMeter` visual language rather than replacing it — pairwise pages
 * keep `ClashMeter`.
 *
 * Leadership is driven by `leaders` (every key tied for the max, straight from
 * `compareRoster().metrics[].leaders`), never by segment width, so near-ties
 * still read correctly. Each leader's segment saturates and glows in that
 * player's accent; a partial tie glows every tied leader. When everyone leads
 * (a full tie, which includes the all-zero row) there is no winner, so the row
 * renders neutrally. An all-zero row splits the track evenly — no divide-by-zero,
 * matching `ClashMeter`'s `a + b === 0` guard.
 *
 * Segments grow out from an even split on entrance, but render at their final
 * widths immediately whenever animation can't/shouldn't run (reduced motion,
 * jsdom) — the same `canAnimate()` gate `ClashMeter` and `AnimatedNumber` use —
 * so the values and the final layout are present on the first paint in tests.
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

/** Each value's share of the track, in [0, 1]. All-zero (or empty) → even split. */
function shares(values: readonly number[]): number[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  if (values.length === 0) return [];
  if (total === 0) return values.map(() => 1 / values.length);
  return values.map((v) => Math.max(0, v) / total);
}

export interface TriClashEntry {
  /** Player key — matched against `leaders`. */
  key: string;
  /** Display name; the accessible label for this player's value. */
  name: string;
  value: number;
  accent: PlayerAccent;
}

export interface TriClashMeterProps {
  label: string;
  /** One entry per player, in config (display) order. */
  entries: readonly TriClashEntry[];
  /** Every player key tied for the max. All keys (or none) → neutral row. */
  leaders: readonly string[];
  /** Formats every value (e.g. play time). Defaults to a localized integer. */
  format?: (n: number) => string;
  /** When set, tints the label with the trophy metal color and shows a metal disc. */
  tier?: TrophyTier;
}

export function TriClashMeter({ label, entries, leaders, format, tier }: TriClashMeterProps) {
  const finalShares = shares(entries.map((e) => e.value));
  // A primitive dependency for the effect: a fresh array each render would re-fire it.
  const sharesKey = finalShares.join(',');

  const leaderSet = new Set(leaders);
  // Everyone tied (incl. all-zero) → no winner: neutral treatment. No leaders at
  // all (malformed data) is neutral too, rather than dimming every player.
  const neutral =
    entries.length === 0 || leaderSet.size === 0 || entries.every((e) => leaderSet.has(e.key));
  const isLeader = (key: string) => !neutral && leaderSet.has(key);

  const [animatable] = useState(canAnimate);
  const [pos, setPos] = useState<number[]>(() =>
    animatable ? entries.map(() => 1 / Math.max(1, entries.length)) : finalShares,
  );

  useEffect(() => {
    if (!animatable) return;
    // Next frame: move from the even split to the real one so the CSS transition runs.
    const target = sharesKey === '' ? [] : sharesKey.split(',').map(Number);
    const id = requestAnimationFrame(() => setPos(target));
    return () => cancelAnimationFrame(id);
  }, [animatable, sharesKey]);

  // Under no-animation — or if the roster size changed since `pos` was set —
  // render the latest data directly so segments and seams never read a stale array.
  const current = animatable && pos.length === finalShares.length ? pos : finalShares;
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

  // Round the outer corners of the first/last *visible* segment, so a zero value
  // at either end doesn't leave a square-cornered neighbour poking past the track.
  const firstVisible = Math.max(0, finalShares.findIndex((n) => n > 0));
  const lastVisible = Math.max(
    0,
    finalShares.length - 1 - [...finalShares].reverse().findIndex((n) => n > 0),
  );
  const widthTransition = animatable ? `width ${duration.slow}s ${EASE}` : undefined;
  const leftTransition = animatable ? `left ${duration.slow}s ${EASE}` : undefined;

  const segmentStyle = (entry: TriClashEntry, i: number): CSSProperties => {
    const lead = isLeader(entry.key);
    return {
      width: pct(current[i] ?? 0),
      background: `linear-gradient(90deg, ${alpha(entry.accent.colorVar, 55)}, ${entry.accent.colorVar}, ${alpha(entry.accent.colorVar, 55)})`,
      transition: widthTransition,
      opacity: lead ? 1 : neutral ? 0.8 : 0.5,
      boxShadow: lead ? `0 0 16px 0 ${alpha(entry.accent.colorVar, 55)}` : undefined,
    };
  };

  // Seams sit at each internal division; tinted by a leading neighbour if any.
  // A seam next to a zero-width segment would stack on another seam or the track
  // edge, so only divisions between two visible segments get one.
  const seams = entries.slice(0, -1).flatMap((entry, i) => {
    if (!(finalShares[i]! > 0 && finalShares[i + 1]! > 0)) return [];
    const left = current.slice(0, i + 1).reduce((s, n) => s + (n ?? 0), 0);
    const next = entries[i + 1]!;
    const colorVar = isLeader(entry.key)
      ? entry.accent.colorVar
      : isLeader(next.key)
        ? next.accent.colorVar
        : 'var(--color-foreground)';
    return [{ id: `${entry.key}|${next.key}`, left, colorVar }];
  });

  return (
    <div data-leaders={neutral ? 'tie' : leaders.join(' ')} className="flex flex-col gap-2">
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

      <ul
        aria-label={label}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, entries.length)}, minmax(0, 1fr))` }}
      >
        {entries.map((entry, i) => {
          const lead = isLeader(entry.key);
          const align = i === 0 ? 'items-start text-left' : i === entries.length - 1 ? 'items-end text-right' : 'items-center text-center';
          return (
            <li
              key={entry.key}
              data-player={entry.key}
              data-leader={lead ? 'true' : 'false'}
              className={`flex flex-col ${align}`}
            >
              <span className="flex items-center gap-1 text-xs text-foreground-muted">
                <span aria-hidden="true" className={entry.accent.text}>
                  {entry.accent.glyph}
                </span>
                <span>{entry.name}</span>
              </span>
              <span
                className={`font-bold tabular-nums transition-all ${lead ? 'text-2xl' : 'text-lg text-foreground-muted'}`}
                style={
                  lead
                    ? { color: entry.accent.colorVar, textShadow: `0 0 18px ${alpha(entry.accent.colorVar, 55)}` }
                    : undefined
                }
              >
                <AnimatedNumber value={entry.value} {...(format ? { format } : {})} />
              </span>
              {lead ? <span className="sr-only">(leader)</span> : null}
            </li>
          );
        })}
      </ul>

      {/* The track encodes proportion redundantly with the values above, so it's
          decorative to assistive tech; the values carry the meaning. */}
      <div
        aria-hidden="true"
        className="relative flex h-3.5 overflow-visible rounded-pill bg-white/5 shadow-[inset_0_0_0_1px_var(--color-border-subtle)]"
      >
        {entries.map((entry, i) => (
          <div
            key={entry.key}
            data-segment={entry.key}
            className={`h-full ${i === firstVisible ? 'rounded-l-pill' : ''} ${i === lastVisible ? 'rounded-r-pill' : ''}`}
            style={segmentStyle(entry, i)}
          />
        ))}

        {seams.map((seam) => (
          <div
            key={seam.id}
            data-seam=""
            className="pointer-events-none absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ left: pct(seam.left), transition: leftTransition }}
          >
            <span
              className="absolute -top-2 -bottom-2 w-[3px] rounded"
              style={{ background: seam.colorVar, boxShadow: `0 0 14px 2px ${alpha(seam.colorVar, 45)}` }}
            />
            <span
              className="relative block h-4 w-4 text-white motion-safe:animate-flicker"
              style={{ filter: `drop-shadow(0 0 6px ${seam.colorVar})` }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
                <path d="M13.5 1.5 4 13.2c-.3.4 0 .9.5.9h4.4l-1.6 7.9c-.1.6.7.9 1 .4L20 10.5c.3-.4 0-.9-.5-.9h-4.6l1.6-7.7c.1-.6-.7-.9-1-.4z" />
              </svg>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
