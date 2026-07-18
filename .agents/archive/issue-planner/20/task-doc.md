# Task Doc — Phase 6: Motion polish (#20)

## Prerequisites

- [x] #17 (Splash), #18 (Player page), #19 (Compare page) merged/closed — polish runs over the final
  pages. **All three are closed/completed.** Unblocked.
- [ ] No config or credentials needed (static `site/` work).

## Phase 1: Route transitions (AC1)

- [ ] Create `site/src/components/RouteTransition.tsx`: a `motion.div` wrapper using `fadeRise`
  (`opacity` + small `y` rise), reading `useReducedMotion()` to set the transition to `duration: 0`
  when reduced. Props: `children`. No layout styling beyond a pass-through container.
- [ ] Update `site/src/App.tsx`: import `useLocation` from `react-router` and `AnimatePresence` from
  `motion/react`; wrap the routed content in
  `<AnimatePresence mode="wait" initial={false}>` → `<RouteTransition key={location.pathname}>` →
  `<Routes location={location}>`. Keep `AppShell` (header/nav) **outside** the animated region so it
  stays persistent.
- [ ] Run `pnpm --filter site test site/src/routes.test.tsx` — all four route assertions must stay
  green (AC1 regression guard). Fix wiring, not the tests, if they fail.

## Phase 2: NotFoundPage redesign (AC2)

- [ ] Rewrite `site/src/pages/NotFoundPage.tsx`:
  - Oversized `aria-hidden` ✕ motif in `text-shape-cross`/`fill-shape-cross`, sized from the type
    scale (`text-display`+), with `motion-safe:animate-flicker` (reuses `--animate-flicker`).
  - `<h1>` "Page not found" (`text-3xl sm:text-display`, `text-foreground`) + a muted supporting line.
  - Back-home CTA: `GlassCard as={Link} to="/" glow` with accessible name "Back to home".
  - `main` container matching the other pages' rhythm (`mx-auto max-w-… px-4 py-…`, centered).
- [ ] Create `site/src/pages/NotFoundPage.test.tsx`: assert the `heading` /page not found/i and a
  `link` /back to home/i with `href="/"`; assert the decorative ✕ is not in the a11y tree.

## Phase 3: Accessibility & consistency audit (AC3–AC6)

- [ ] **Contrast (AC4):** add `--color-ps-blue-text: #4c9ff0;` to the `@theme` block in
  `site/src/styles/theme.css` (single central token; no existing value changes). Point the AppShell
  "Stats" wordmark (`site/src/components/AppShell.tsx:46`) at the generated `text-ps-blue-text`
  utility. Leave all decorative/large ps-blue usages (splash headline, VsHero mark, glows, focus
  ring) on `text-ps-blue`. Re-run the audit script (see below) to confirm every UI text/surface pair
  clears its threshold.
- [ ] **Consistency sweep (AC3):** read `SplashPage`, `PlayerPage`, `ComparePage`, `NotFoundPage` +
  shared components; reconcile page container spacing to an intentional set (see design-doc table),
  ensure every `<h1>` uses the same scale, no hand-rolled glass surfaces outside `GlassCard`, no
  inline `duration:`/`ease:` literals outside the preset idiom. Corrective only — no restyling.
- [ ] **Reduced motion (AC5):** with the browser's `prefers-reduced-motion: reduce`, load every route
  via `pnpm --filter site dev` and confirm each renders complete and static — nothing stuck at
  `opacity: 0`, no drift/glow/flicker/route animation running. Cross-check `HeroIllustration`,
  `PlayerPage` backdrop drift, `ClashMeter` seam/bolt, and the new route transition + 404 flicker.
- [ ] **Keyboard (AC6):** tab through every page; confirm logical focus order, a visible PS-blue
  `:focus-visible` ring on all links/interactive elements (already global in `theme.css:98`), and
  that decorative animated elements (`aria-hidden` SVGs/glyphs) never receive focus.

## Phase 4: Tests, verification & gate (AC7–AC8)

- [ ] Extend/confirm jsdom-assertable coverage: `NotFoundPage.test.tsx` (Phase 2) + `routes.test.tsx`
  green.
- [ ] Manual browser verification notes captured for the PR "How to test" section (reduced-motion,
  keyboard, real navigation crossfade — the non-jsdom checks).

## Pre-Commit Gate

From AGENTS.md `## Commands` → `site/` workspace commands. All must be green before commit:

- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm --filter site typecheck` ✅
- [ ] `pnpm --filter site test` ✅
- [ ] `pnpm --filter site build` ✅

> Root package is untouched, but per AGENTS.md the whole workspace should be green — a quick root
> `pnpm lint && pnpm typecheck && pnpm test && pnpm build` is a cheap sanity check before pushing.

### Audit script (reference, not committed)

The WCAG ratios in the design doc were computed with a small Node script (sRGB relative luminance,
translucent-overlay blend for surfaces 1–3). Re-run an equivalent check after the token change to
confirm `ps-blue-text` and all in-use pairs clear their thresholds. Keep it in scratch, not the repo.

## Files Modified / Created

| File | Change |
|---|---|
| `site/src/components/RouteTransition.tsx` | **New** — keyed crossfade+rise wrapper, reduced-motion aware |
| `site/src/App.tsx` | Wrap routed content in `AnimatePresence`/`RouteTransition`, pass frozen `location` to `Routes` |
| `site/src/pages/NotFoundPage.tsx` | **Redesign** — flicker ✕ motif, type-scale copy, glowing back-home `GlassCard` link |
| `site/src/pages/NotFoundPage.test.tsx` | **New** — heading + back-home link assertions |
| `site/src/styles/theme.css` | Add `--color-ps-blue-text: #4c9ff0` (one new token; no value changes) |
| `site/src/components/AppShell.tsx` | Wordmark "Stats" → `text-ps-blue-text` (AA-body fix) |
| `site/src/components/RouteTransition.test.tsx` | **New (optional)** — children present on first commit |
| Any page/component with drift found in the sweep | Corrective: replace one-off spacing/timing with tokens/presets (only if drift exists) |
