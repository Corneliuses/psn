# Design Doc — Phase 2: Component kit — trophy badges, stat tiles, animated numbers, GameSection redesign (#16)

## Overview

Build the reusable, PlayStation-styled component kit that every later page redesign (#17 Splash,
#18 Player, #19 Compare) composes: `GlassCard`, `TrophyBadge`, `StatTile`, `AnimatedNumber`,
`SectionHeader`, plus a visual redesign of the existing `GameSection`. This is the sole gate
between the Phase 1 foundation (design tokens + Motion presets, #15) and the page work, so the
primitives must be correct, accessible, and animation-consistent before anything builds on them.

## Acceptance Criteria

- [ ] `GlassCard` — shared elevated glassy surface (overlay, hairline border, radius) with a
      hover lift and an optional PS-blue glow variant; all later card-like UI composes it.
- [ ] `TrophyBadge` — tier icon + count in the trophy-metal token colors
      (bronze/silver/gold/platinum) with an accessible label naming the tier
      (e.g. "3 platinum trophies").
- [ ] `StatTile` — big-number + label card with an entrance animation via the shared `fadeRise`
      preset; composes `GlassCard` and `AnimatedNumber`.
- [ ] `AnimatedNumber` — Motion-driven count-up that renders the **final value immediately**
      under reduced motion and in jsdom tests (assert the final number, no timers required).
- [ ] `SectionHeader` — heading with a decorative PS-shape glyph accent (`aria-hidden`, rotating
      through △ ○ ✕ □ per section).
- [ ] `GameSection` redesigned: rows become cards in the new language (rounded game-icon tile,
      name, metric, hover lift + glow, staggered entrance via `staggerChildren`).
- [ ] `GameSection` still satisfies its existing tests: heading role, one `listitem` per game,
      decorative icon with empty `alt`, empty-state paragraph with `emptyLabel` fallback.
- [ ] Component tests for every new primitive (render, accessible names, reduced-motion / jsdom
      final states).
- [ ] `pnpm --filter site lint`, `typecheck`, `test`, and `build` all pass.

## Architecture & Data Model

### Data Layer

No data-layer changes. `TrophyBadge` consumes the existing `TrophyCounts { bronze, silver, gold,
platinum }` shape from `src/psn/models.ts` (exported via the `psn` workspace package). The
`GameEntry { id, iconUrl, name, metric }` interface in `GameSection.tsx` **stays byte-for-byte
unchanged** so `PlayerPage`'s `sectionEntries` mapping (`site/src/pages/PlayerPage.tsx:19-58`)
keeps compiling. This issue wires **no** primitive into any page — pages are Phases #18/#19.

### Component / API Layer

| Component | Key props | Purpose |
|---|---|---|
| `GlassCard` | `children`, `glow?: boolean`, `as?`, `className?`, `...rest` | Base elevated surface; hover lift, optional glow. |
| `TrophyBadge` | `tier: 'bronze'\|'silver'\|'gold'\|'platinum'`, `count: number` | Tier icon + count with accessible label. |
| `StatTile` | `label: string`, `value: number`, `format?: (n)=>string` | Big animated number + caption card. |
| `AnimatedNumber` | `value: number`, `format?: (n)=>string`, `durationMs?` | Count-up to `value`; jsdom/reduced-motion-safe. |
| `SectionHeader` | `title: string`, `shapeIndex?: number` (or `shape?`) | Heading + decorative rotating shape glyph. |
| `GameSection` | *(unchanged public API)* `heading`, `games`, `emptyLabel?` | Redesigned game list; same semantics. |

All primitives live in `site/src/components/`. A small `site/src/components/trophyShapes.ts`-style
helper is **not** required; the shape glyph rotation can be a module-level const array inside
`SectionHeader.tsx`.

### Component Tree (later consumers — for context only, not built here)

```
StatTile         → GlassCard → (motion.div fadeRise) + AnimatedNumber
GameSection      → SectionHeader? + ul > (motion.li staggerChildren) > GlassCard(row)
TrophyBadge      → standalone (used by #18/#19)
```

## Key Decisions

### Decision 1: `AnimatedNumber` count-up must be jsdom- and reduced-motion-safe

**Options considered:**
- Option A: Initialize display state to `0`, always animate up via Motion's `animate()` in an
  effect. Simple, but in jsdom (no advanced rAF) and under reduced motion the DOM would read `0`,
  failing the "assert the final number, no timers" AC.
- Option B: Initialize the rendered text to the **final formatted value**, and only start a
  count-up from `0` inside a `useEffect` when motion is actually enabled
  (`useReducedMotion()` is false). The first (and jsdom-only) paint shows the final value; the
  animation is a progressive enhancement layered on afterward.

**Decision:** Option B.
**Rationale:** It satisfies the AC verbatim — jsdom render and reduced-motion users see the final
number with no fake timers — while still delivering the count-up for real browsers. It keeps the
tests trivial (`getByText(formattedFinal)`), matching the existing Testing-Library style. Motion's
`useReducedMotion()` safely returns `false` when `matchMedia` is absent, so we gate the animation
on it rather than sniffing the test environment.

### Decision 2: `GameSection` keeps its exact DOM semantics under a new visual skin

**Options considered:**
- Option A: Rebuild the markup freely (e.g. cards as `<div role="listitem">`), updating the tests.
- Option B: Preserve the `section > h2`, `ul > li`, `img alt=""`, and empty `<p>` structure
  exactly, adding styling + `motion` wrappers around/inside those elements.

**Decision:** Option B.
**Rationale:** The issue explicitly requires the existing `GameSection.test.tsx` semantics to keep
passing (heading role, `listitem` per game, empty-alt decorative image, empty-state paragraph).
Wrapping the `<ul>` in `motion.ul`/each `<li>` in `motion.li` and composing `GlassCard` **inside**
each `<li>` preserves the accessibility tree while delivering the redesign. `GlassCard` must
therefore support rendering as a non-`li` element (default `div`) so it nests cleanly inside `<li>`.

### Decision 3: Fixture icon URLs never load — icon tiles need a graceful empty state

**Decision:** Render each game icon as an `<img alt="">` layered over a `bg-surface-2` rounded
tile, so a non-resolving `https://image.example/...` URL shows a neutral surface rather than a
broken-image glyph. No `onError` JS needed — the surface simply sits behind the transparent
(unloaded) `img`.
**Rationale:** Keeps the decorative-image accessibility contract (empty `alt`) intact while looking
intentional against fixture data, per the issue's Context note.

## Security & Permissions

None. This is presentational, client-only UI with no auth surface, no new data access, and no
secret handling. No roles or access rules are touched.

## Error Handling

- `AnimatedNumber`: non-finite/negative `value` → format defensively; default `format` is
  `Intl.NumberFormat`/`String(n)`. No throw path.
- `TrophyBadge`: `tier` is a closed union, so an unknown tier is a type error at compile time; no
  runtime fallback needed.
- Icon load failure: handled visually via the surface-behind-`img` treatment (Decision 3).

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| `GlassCard` | Unit | `site/src/components/GlassCard.test.tsx` | Renders children; applies glow variant class/attr; passes through `className`. |
| `TrophyBadge` | Unit | `site/src/components/TrophyBadge.test.tsx` | Accessible label per tier ("3 platinum trophies"); renders count. |
| `AnimatedNumber` | Unit | `site/src/components/AnimatedNumber.test.tsx` | Final formatted value present on render, no timers; custom `format` applied. |
| `StatTile` | Unit | `site/src/components/StatTile.test.tsx` | Renders label + final value; composes card. |
| `SectionHeader` | Unit | `site/src/components/SectionHeader.test.tsx` | Heading role/name; decorative glyph is `aria-hidden` / not in a11y tree. |
| `GameSection` | Unit | `site/src/components/GameSection.test.tsx` | **Existing suite must stay green**; extend only if needed. |

Follow the existing patterns in `GameSection.test.tsx`: Testing Library roles/names, `within()`
scoping, and direct `querySelector` **only** for decorative (empty-alt) images.

## Config Changes

- [ ] Schema / index changes — none required.
- [ ] Access rule changes — none required.
- [ ] Environment variables — none required.
- [ ] Dependency changes — none required (`motion` ^12 already in `site/package.json`).

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| `<motion.*>` in jsdom leaves numbers/entrances at initial state | Med | `AnimatedNumber` renders final value on first paint (Decision 1); entrance variants (`fadeRise`/`staggerChildren`) don't gate content visibility — assert on text/roles, not opacity. |
| Redesign accidentally breaks `GameSection` a11y contract | Med | Preserve exact DOM roles (Decision 2); run the existing test file unchanged as the gate. |
| Reduced-motion users get motion anyway | Low | Compose shared presets under the app-level `<MotionConfig reducedMotion="user">`; gate `AnimatedNumber` on `useReducedMotion()`. |
| Fixture icons render as broken images | Low | Surface tile behind the `img` (Decision 3). |
| One-off durations/easings/hex colors creep into components | Low | Use only token utilities (`bg-surface-*`, `text-trophy-*`, `shadow-glow*`) and presets from `motion/presets.ts`; lint/review gate. |
| `GlassCard` hardcoded as `<div>` can't nest in `<li>` | Low | `as` prop (polymorphic) or render `GlassCard` as a `<div>` inside the `<li>` rather than replacing it. |
