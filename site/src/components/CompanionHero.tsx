import { motion, useReducedMotion } from 'motion/react';
import type { ComponentType } from 'react';
import { Link } from 'react-router';

import type { Companion, CompanionBackdrop } from '../companions/types';
import { duration, easing, fadeRise, staggerChildren } from '../motion/presets';
import { TOGETHER_PATH } from '../routes';
import { GlassCard } from './GlassCard';

/*
 * The companion page's opening panel: a way back to the grid, the title, the
 * tagline as an eyebrow, the blurb, and the content's headline facts as chips.
 *
 * A title can ask for an abstract backdrop by name. Backdrops are original
 * drawings built from theme tokens — never game art, logos or emblems — and are
 * purely decorative (`aria-hidden`). The skyline's searchlights sweep with a
 * rotate (a transform), and are also gated on `useReducedMotion` so the hero is
 * completely still for anyone who asks for less motion.
 */

/**
 * Building silhouettes as [x, width, height] for one 800-wide block of the
 * 170-high skyline strip. The strip draws the block twice (1600 wide) so a wide
 * desktop hero crops only a little off the top instead of zooming into the bases.
 */
const BUILDINGS: readonly [number, number, number][] = [
  [0, 46, 70], [44, 30, 104], [72, 52, 58], [122, 26, 132], [146, 58, 86],
  [202, 34, 150], [234, 48, 96], [280, 22, 120], [300, 60, 66], [358, 38, 112],
  [394, 28, 164], [420, 54, 90], [472, 34, 128], [504, 46, 74], [548, 26, 142],
  [572, 58, 100], [628, 32, 118], [658, 50, 80], [706, 30, 138], [734, 66, 92],
];

/** A few lit windows, [x, y], deliberately sparse so it reads as night. */
const WINDOWS: readonly [number, number][] = [
  [56, 82], [132, 56], [132, 76], [214, 38], [226, 60], [250, 94], [372, 74], [404, 26],
  [404, 50], [484, 60], [558, 42], [590, 86], [640, 68], [716, 50], [716, 72], [760, 96],
];

function Beam({ x, from, to, still }: { x: number; from: number; to: number; still: boolean }) {
  const sweep = still
    ? { style: { originX: 0.5, originY: 1, rotate: (from + to) / 2 } }
    : {
        style: { originX: 0.5, originY: 1 },
        initial: { rotate: from },
        animate: { rotate: [from, to, from] },
        transition: { duration: duration.slow * 14, ease: easing.inOut, repeat: Infinity },
      };

  return <motion.polygon points={`${x - 70},0 ${x + 70},0 ${x + 4},260 ${x - 4},260`} fill="url(#hero-beam)" {...sweep} />;
}

function Skyline() {
  const still = useReducedMotion() ?? false;

  return (
    <>
      {/* Searchlights: a faint full-height layer that sweeps behind the text. */}
      <svg
        viewBox="0 0 800 260"
        preserveAspectRatio="xMidYMax slice"
        className="pointer-events-none absolute inset-0 size-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="hero-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="var(--color-ps-blue)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--color-ps-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <Beam x={250} from={-18} to={10} still={still} />
        <Beam x={600} from={16} to={-12} still={still} />
      </svg>

      {/* The city: a strip along the bottom edge, below the text and the fact chips. */}
      <svg
        viewBox="0 0 1600 170"
        preserveAspectRatio="xMidYMax slice"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full sm:h-24"
        aria-hidden="true"
        focusable="false"
      >
        {[0, 800].map((offset) => (
          <g key={offset} transform={`translate(${offset} 0)`}>
            <g className="fill-surface-0" opacity="0.9">
              {BUILDINGS.map(([x, width, height]) => (
                <rect key={x} x={x} y={170 - height} width={width} height={height} />
              ))}
            </g>
            <g className="fill-ps-blue-text" opacity="0.45">
              {WINDOWS.map(([x, y]) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="5" height="7" rx="1" />
              ))}
            </g>
          </g>
        ))}

        {/* The four abstract shapes, as distant lights over the rooftops — kept to
            the middle of the strip, which is what a phone-width hero shows. */}
        <polygon points="520,70 528,84 512,84" className="fill-shape-triangle" opacity="0.6" />
        <rect x="676" y="62" width="10" height="10" rx="2" className="fill-shape-square" opacity="0.6" transform="rotate(18 681 67)" />
        <g className="stroke-shape-cross" strokeWidth="3" strokeLinecap="round" opacity="0.6">
          <line x1="885" y1="80" x2="895" y2="90" />
          <line x1="895" y1="80" x2="885" y2="90" />
        </g>
        <circle cx="1130" cy="80" r="6" className="fill-shape-circle" opacity="0.6" />
      </svg>
    </>
  );
}

const BACKDROPS: Record<CompanionBackdrop, ComponentType> = {
  skyline: Skyline,
};

export interface CompanionHeroProps {
  companion: Pick<Companion, 'name' | 'tagline' | 'blurb' | 'facts' | 'backdrop'>;
}

export function CompanionHero({ companion }: CompanionHeroProps) {
  const Backdrop = companion.backdrop ? BACKDROPS[companion.backdrop] : null;

  return (
    <GlassCard
      glow
      className={`relative mb-10 overflow-hidden p-8 sm:p-10 ${Backdrop ? 'pb-24 sm:pb-28' : ''}`}
    >
      {Backdrop ? <Backdrop /> : null}

      <div className="relative">
        <Link
          to={TOGETHER_PATH}
          className="text-sm font-semibold text-ps-blue-text transition-colors hover:text-foreground"
        >
          &larr; All companion apps
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-ps-blue-text">
          {companion.tagline}
        </p>
        <h1 className="mt-1 text-3xl font-bold leading-none text-foreground sm:text-display">{companion.name}</h1>
        <p className="mt-3 max-w-2xl text-foreground-muted">{companion.blurb}</p>

        {companion.facts?.length ? (
          <motion.dl
            className="m-0 mt-6 flex flex-wrap gap-2"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            {companion.facts.map((fact) => (
              <motion.div
                key={fact.label}
                variants={fadeRise}
                className="rounded-pill border border-border-strong bg-surface-0 px-3.5 py-1.5 text-sm"
              >
                <dt className="inline text-foreground-muted">{fact.label} </dt>
                <dd className="m-0 inline font-semibold text-foreground">{fact.value}</dd>
              </motion.div>
            ))}
          </motion.dl>
        ) : null}
      </div>
    </GlassCard>
  );
}
