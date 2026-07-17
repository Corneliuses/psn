import { Link } from 'react-router';

import { GlassCard } from '../components/GlassCard';

/*
 * Designed 404: an oversized decorative ✕ in the shape-cross motif with a subtle
 * glitch flicker, "Page not found" copy in the type scale, and a glowing
 * back-home GlassCard link. The ✕ is aria-hidden — the heading and link carry
 * the accessible meaning. The flicker reuses the shared `--animate-flicker`
 * utility applied as `motion-safe:` so it never runs under reduced motion (same
 * pattern as the compare-page clash-meter bolt); no bespoke keyframes.
 */

export function NotFoundPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-16 text-center">
      <span
        aria-hidden="true"
        className="motion-safe:animate-flicker select-none text-[7rem] font-bold leading-none text-shape-cross sm:text-[10rem]"
        style={{ textShadow: '0 0 40px var(--color-shape-cross)' }}
      >
        ✕
      </span>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-display">
          Page not found
        </h1>
        <p className="text-foreground-muted">
          This screen wandered off the grid. Let&rsquo;s get you back home.
        </p>
      </div>

      <GlassCard
        as={Link}
        to="/"
        glow
        className="px-6 py-3 text-lg font-semibold text-foreground no-underline"
      >
        Back to home
      </GlassCard>
    </main>
  );
}
