# Task Doc — Phase 3: Splash page — hero illustration & animated landing (#17)

## Prerequisites

- [x] #16 (Phase 2 component kit) merged — `GlassCard`, `SectionHeader`,
  `AnimatedNumber`, motion presets all present on the branch.
- [ ] Working on branch `claude/issue-planner-nsybhr` off the latest default branch.

This is a single-package (`site/`) frontend change with no data-layer or config
dependency, so it is **not phased** — all work lands in one reviewable PR. The
checklist below is ordered so each step compiles on top of the previous.

## Phase 1: Hero illustration component

- [ ] Create `site/src/components/HeroIllustration.tsx`:
  - Inline `<svg>` with `role="img"` and a descriptive `aria-label` (e.g. "A dad
    and his son sitting together with game controllers"). No text trademarks.
  - Two silhouetted player figures holding controllers, drawn on the dark surface
    using theme token colors (`fill`/`className` from surface + foreground tokens).
  - Four abstract PS-shape confetti accents (triangle △, circle ○, cross ✕,
    square □) colored from the shape tokens (`text-shape-triangle`,
    `text-shape-circle`, `text-shape-cross`, `text-shape-square`); mark them
    `aria-hidden`/decorative so they don't pollute the accessible name.
  - Wrap in `motion.*` with a subtle idle float (small looping `y`) + glow
    composed from `glowPulse` / tokenized `duration`+`easing` in
    `site/src/motion/presets.ts` — no new keyframes. Reduced motion is handled by
    the app-level `<MotionConfig reducedMotion="user">`.
- [ ] Write `site/src/components/HeroIllustration.test.tsx`:
  - Renders an element with `role="img"` and the expected `aria-label`.
  - Confirms the shape accents are decorative (the accessible name is only the
    label, not the glyphs).

## Phase 2: Splash page redesign

- [ ] Add a small pure title helper (colocated in `SplashPage.tsx` or a local
  module): compose the heading from `players` as
  `${displayNames.join(' & ')}’s PlayStation Stats`, returning the segments the
  stagger animates (e.g. `[namesLine, 'PlayStation Stats']`). Never hardcode
  "Dad"/"Braidan".
- [ ] Add a derived invitation-line helper: from a `displayName`, produce copy
  like `Explore ${displayName}’s trophies & playtime`.
- [ ] Rewrite `site/src/pages/SplashPage.tsx`:
  - `motion.main` as the top-level stagger container: `variants={staggerChildren}`,
    `initial="hidden"`, `animate="visible"`, plus layout classes (centered,
    `max-w-*`, spacing) consistent with `AppShell`'s container width.
  - `motion.div` (variants `fadeRise`) wrapping `<HeroIllustration />`.
  - `motion.h1` (variants `fadeRise`) containing the animated title; inner
    `motion.span` segments animate per-line/word from the same presets. Keep all
    text inside the single `<h1>` so the accessible name is the full string.
  - `motion.ul` (variants `staggerChildren`) of portal cards — one `motion.li`
    (variants `fadeRise`) per `players` entry, each a
    `GlassCard glow as={Link} to={playerPath(player.key)}` showing the display
    name and the derived invitation line. Large card sizing/padding.
  - `motion.div` (variants `fadeRise`) compare CTA: a VS-styled banner
    `GlassCard glow as={Link} to={COMPARE_PATH}`. Make the "VS" treatment
    decorative (`aria-hidden`) and keep the link's accessible name exactly
    `Compare` (visible label or `aria-label="Compare"`).
- [ ] Remove the `PlaceholderGraphic` import from `SplashPage.tsx`.

## Phase 3: Delete the placeholder

- [ ] Delete `site/src/components/PlaceholderGraphic.tsx` (grep confirms
  `SplashPage` was its only consumer).

## Phase 4: Tests

- [ ] Extend `site/src/pages/SplashPage.test.tsx`:
  - Keep the existing assertion: one link per player located by
    `getByRole('link', { name: new RegExp(player.displayName) })` with
    `href = /${player.key}`, plus the compare link `getByRole('link', { name: 'Compare' })`
    → `/compare`.
  - Add: the hero renders with `getByRole('img', { name: /.../ })` (accessible name).
  - Add: exactly one link per player (guard against nested/duplicate links) — e.g.
    assert `getAllByRole('link', { name: new RegExp(displayName) })` has length 1.
  - Add: the composed `<h1>` heading is present via
    `getByRole('heading', { level: 1 })` and includes both player display names
    (derived, not hardcoded).

## Pre-Commit Gate

Run from repo root; all must be green before committing (per AGENTS.md):

- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm --filter site typecheck` ✅
- [ ] `pnpm --filter site test` ✅
- [ ] `pnpm --filter site build` ✅

## Files Modified / Created

| File | Change |
|---|---|
| `site/src/components/HeroIllustration.tsx` | **New** — custom father/son SVG hero with decorative PS-shape accents and idle float/glow. |
| `site/src/components/HeroIllustration.test.tsx` | **New** — asserts `role="img"` + accessible name and decorative shapes. |
| `site/src/pages/SplashPage.tsx` | **Rewrite** — hero + animated (config-derived) title + player portal cards + VS compare CTA, all in one staggered entrance. |
| `site/src/pages/SplashPage.test.tsx` | **Extend** — keep nav-link assertions; add hero img, one-link-per-player, and heading checks. |
| `site/src/components/PlaceholderGraphic.tsx` | **Delete** — replaced by `HeroIllustration`. |
