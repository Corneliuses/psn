# Task Doc — Phase 2: Component kit (#16)

## Prerequisites

- [x] #15 (Phase 1: Foundation) merged — design tokens (`site/src/styles/theme.css`) and Motion
      presets (`site/src/motion/presets.ts`) are in place. Confirmed on `main`.
- [] Work on branch `claude/issue-planner-imyuu1` (or the implementation branch), based on latest `main`.

> **Note on phasing:** Phase 1 builds the leaf primitives (no cross-dependencies except tokens);
> Phase 2 builds the composites that depend on them (`StatTile` → `AnimatedNumber` + `GlassCard`;
> `GameSection` → `GlassCard`). This is a single `site` package and can ship as **one PR** — the
> phases are implementation/review order, not separate PRs, unless the diff grows large enough to
> warrant splitting.

## Phase 1: Leaf primitives

- [ ] Create `site/src/components/GlassCard.tsx` — elevated glassy surface using token utilities
      (`bg-surface-2`, `border border-border-subtle`, `rounded-panel`, `shadow-panel`); hover lift
      (`transition-transform hover:-translate-y-0.5`) and an optional `glow` variant
      (`shadow-glow` on hover/when set). Support a polymorphic `as` (default `div`) and pass through
      `className` + rest props so it can nest inside a `<li>`.
- [ ] Create `site/src/components/AnimatedNumber.tsx` — count-up to `value`. Initialize rendered
      text to the final formatted value; start a `0→value` count-up in a `useEffect` **only when**
      `useReducedMotion()` is false (Motion `animate()` + a `useMotionValue`/`useState` bridge).
      Accept optional `format: (n:number)=>string` (default `Intl.NumberFormat`) and `durationMs`.
- [ ] Create `site/src/components/TrophyBadge.tsx` — tier glyph/dot in the matching trophy-metal
      token color (`text-trophy-bronze|silver|gold|platinum`) + count; render an accessible label
      `"{count} {tier} troph{y|ies}"` (via visible text or `aria-label`). `tier` is a closed union.
- [ ] Create `site/src/components/SectionHeader.tsx` — `<h2>` (or configurable level) with the
      title and a decorative shape glyph (`aria-hidden`) rotating through `['△','○','✕','□']` by a
      `shapeIndex` prop (module-level const array, shape color from `text-shape-*` tokens).
- [ ] Write `site/src/components/GlassCard.test.tsx` — renders children, applies glow variant,
      forwards `className`.
- [ ] Write `site/src/components/AnimatedNumber.test.tsx` — final formatted value present on
      render with no fake timers; custom `format` applied.
- [ ] Write `site/src/components/TrophyBadge.test.tsx` — accessible label per tier
      (assert "3 platinum trophies" etc.); count visible.
- [ ] Write `site/src/components/SectionHeader.test.tsx` — heading role + name; glyph is
      `aria-hidden` (absent from a11y tree, assert via `querySelector`).

## Phase 2: Composites + GameSection redesign

- [ ] Create `site/src/components/StatTile.tsx` — composes `GlassCard`; big `AnimatedNumber` value
      + muted `label`; entrance via the shared `fadeRise` preset (`motion.div variants={fadeRise}`,
      `initial="hidden" animate="visible"` or `whileInView`).
- [ ] Redesign `site/src/components/GameSection.tsx` — keep `GameEntry`/`GameSectionProps` and the
      `section > h2` / `ul > li` / empty-`<p>` structure exactly (existing tests are the gate).
      Wrap `<ul>` as `motion.ul variants={staggerChildren}` and each `<li>` as `motion.li`
      (variant = `fadeRise`); inside each `<li>` render a `GlassCard` (as `div`) holding a rounded
      icon tile (`img alt=""` over `bg-surface-2`), name, and metric, with hover lift + glow.
      Do **not** change the `<img alt="">` decorative contract.
- [ ] Write `site/src/components/StatTile.test.tsx` — renders `label` and final `value`.
- [ ] Extend/keep `site/src/components/GameSection.test.tsx` green — run the existing suite
      unchanged first; add cases only for genuinely new asserted behavior (e.g. icon tile present).

## Pre-Commit Gate

Run from repo root (per `AGENTS.md` → Commands). This issue touches only `site/`, but confirm the
root package still builds too if any shared type is referenced.

- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm --filter site typecheck` ✅
- [ ] `pnpm --filter site test` ✅
- [ ] `pnpm --filter site build` ✅

## Files Modified / Created

| File | Change |
|---|---|
| `site/src/components/GlassCard.tsx` | New — base elevated glassy surface primitive. |
| `site/src/components/GlassCard.test.tsx` | New — unit tests. |
| `site/src/components/AnimatedNumber.tsx` | New — jsdom/reduced-motion-safe count-up. |
| `site/src/components/AnimatedNumber.test.tsx` | New — asserts final value, no timers. |
| `site/src/components/TrophyBadge.tsx` | New — tier icon + count, accessible label. |
| `site/src/components/TrophyBadge.test.tsx` | New — per-tier accessible name. |
| `site/src/components/SectionHeader.tsx` | New — heading + decorative shape glyph. |
| `site/src/components/SectionHeader.test.tsx` | New — heading role, aria-hidden glyph. |
| `site/src/components/StatTile.tsx` | New — big-number tile composing card + AnimatedNumber. |
| `site/src/components/StatTile.test.tsx` | New — label + value render. |
| `site/src/components/GameSection.tsx` | Redesigned — card rows, motion stagger; same public API + semantics. |
| `site/src/components/GameSection.test.tsx` | Keep green; extend only if new behavior added. |
