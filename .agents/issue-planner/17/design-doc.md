# Design Doc — Phase 3: Splash page — hero illustration & animated landing (#17)

## Overview

Turn the splash page from a bare `<h1>` + placeholder SVG + link list into the
site's front door: a real custom father-&-son hero illustration, an animated
title composed from the configured player names, large per-player portal cards,
and a VS-styled compare call-to-action — all entering with a single staggered
hero sequence. This is Phase 3 of the "Design v1 — PlayStation-vibe UI"
milestone, building directly on the Phase 2 component kit (#16).

## Acceptance Criteria

- [ ] `PlaceholderGraphic` is replaced by a real custom SVG hero illustration:
  two silhouetted players (dad and son) holding controllers on the dark surface,
  PS-shape confetti accents in the shape token colors, and a subtle idle
  float/glow loop composed from the shared motion presets; it keeps a meaningful
  `role="img"` + `aria-label`.
- [ ] `site/src/components/PlaceholderGraphic.tsx` is deleted along with its only
  usage (in `SplashPage`).
- [ ] The title "Dad & Braidan's PlayStation Stats" is rendered as an animated,
  staggered fade-rise treatment composed from `staggerChildren`/`fadeRise` (no
  bespoke keyframes), with the player names **derived from config**, not hardcoded.
- [ ] One large `GlassCard` portal card per configured player: display name, a
  derived invitation line, hover lift + glow, wrapping a link to `playerPath(key)`.
- [ ] A compare CTA styled as a VS banner links to `COMPARE_PATH`.
- [ ] The whole page enters with staggered choreography: hero → title → cards → CTA.
- [ ] `SplashPage.test.tsx` still passes and is extended: nav links by role/name
  survive the redesign, plus assertions for the hero img accessible name, exactly
  one link per player, and the compare link.
- [ ] `pnpm --filter site lint`, `typecheck`, `test`, and `build` all pass.

## Architecture & Data Model

### Data Layer

No data-layer or schema changes. Both clarified decisions chose the lighter
option:

- **Title names** are derived from the existing `players` config
  (`players[].displayName`) — no new field.
- **Invitation line** is derived from each player's `displayName` — no new
  config field, no `PlayerConfig`/`psn.config.json` change.

`site/` continues to read only `src/stats` and `data/*/latest.json`; this issue
touches neither.

### API / Service Layer

None. This is a presentational, client-only change.

### UI Component Tree

```
SplashPage (motion.main, variants=staggerChildren, initial=hidden, animate=visible)
├── motion.div variants=fadeRise ── <HeroIllustration />   (new component)
├── motion.h1  variants=fadeRise ── animated title
│     └── per-segment motion spans (name line + "PlayStation Stats"), fadeRise
├── motion.ul  variants=staggerChildren ── player portal cards
│     └── motion.li variants=fadeRise (one per player)
│           └── GlassCard glow as={Link} to={playerPath(key)}
│                 ├── display name
│                 └── derived invitation line
└── motion.div variants=fadeRise ── Compare VS banner
      └── GlassCard glow as={Link} to={COMPARE_PATH}  (accessible name "Compare")
```

- **`HeroIllustration`** is a new component in `site/src/components/`. It owns the
  custom SVG (silhouettes + four abstract PS shapes) and its idle float/glow. It
  exposes `role="img"` + a descriptive `aria-label` and honours reduced motion
  (the app is wrapped in `<MotionConfig reducedMotion="user">`).
- **Portal cards & Compare CTA** compose the existing `GlassCard` (which already
  provides the glass surface, hover lift, and `glow` on-hover glow) via its
  polymorphic `as` prop, rendering as a react-router `Link`.
- **Title** is a single `<h1>` whose accessible name is the full string; visible
  animation is applied to inner `motion.span` segments so screen readers still
  read one coherent heading.

## Key Decisions

### Decision 1: Title names derived from config, not hardcoded

**Options considered:**
- Option A: Compose the title from `players[].displayName`, e.g.
  `${names.join(' & ')}'s PlayStation Stats`.
- Option B: Keep "Dad & Braidan's PlayStation Stats" as a fixed brand string.

**Decision:** Option A (confirmed with the requester).
**Rationale:** The repo rule (AGENTS.md, `config/players.ts`) is to never
hardcode player names in UI. Deriving the title keeps the splash headline
consistent with `AppShell`'s config-driven nav. A small pure helper composes the
name list and appends the possessive suffix; it degrades sensibly if the player
list ever changes (joins all display names with " & "). The exact rendered string
for today's two-player config is unchanged.

### Decision 2: Invitation line derived from display name, no schema change

**Options considered:**
- Option A: Generate the line from `displayName` (e.g. "Explore {name}'s trophies
  & playtime").
- Option B: Add an optional `tagline`/`invitation` field to `psn.config.json` +
  `PlayerConfig`.

**Decision:** Option A (confirmed with the requester).
**Rationale:** Keeps this a purely presentational frontend change with no
data-layer/schema churn or `schemaVersion` considerations. A per-player copy field
can be added later if editorial control is wanted; that would be a separate,
config-touching change.

### Decision 3: Hero as a dedicated component, not inline SVG in the page

**Options considered:**
- Option A: New `HeroIllustration.tsx` component.
- Option B: Inline the SVG directly in `SplashPage`.

**Decision:** Option A.
**Rationale:** Mirrors how `PlaceholderGraphic` was factored (a named component
the page imports), keeps `SplashPage` focused on layout/choreography, and gives
the illustration its own unit test for the accessible name and shape accents.

### Decision 4: Compose `GlassCard`/motion presets, author no new primitives

**Decision:** Portal cards and the compare banner reuse `GlassCard` (with `glow`)
and the existing `fadeRise`/`staggerChildren`/`glowPulse` presets. The idle
hero float uses a small looping `y` animation built on the tokenized
`duration`/`easing`, not a new bespoke keyframe set.
**Rationale:** AGENTS.md mandates composing the Phase 2 kit and shared presets
rather than re-styling surfaces or redefining timing inline.

## Security & Permissions

None. The splash page is public and unauthenticated; no roles, tokens, or access
rules are involved. No Sony trademarks — original silhouettes and the four
abstract shape motifs only, colored from the existing shape tokens.

## Error Handling

Minimal surface. The illustration is self-contained inline SVG (no network image
to fail). Links are static route paths. If the player config were empty, the
cards list simply renders nothing and the title falls back to just
"'s PlayStation Stats"-avoidance is handled by the title helper (renders
"PlayStation Stats" with no leading possessive when there are no names).

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Page | Unit (RTL + jsdom) | `site/src/pages/SplashPage.test.tsx` | Keep the existing link-by-role assertions; add hero `img` accessible-name, one link per player, and compare-link (exact name "Compare") checks. |
| Component | Unit (RTL) | `site/src/components/HeroIllustration.test.tsx` | Assert `role="img"` + descriptive `aria-label`; assert the shapes are decorative (not part of the accessible name). |

Motion renders in jsdom without timers; tests assert final DOM/semantics, not
intermediate animation state (consistent with the `AnimatedNumber` convention in
AGENTS.md). No visual-regression baselines exist in this repo.

## Config Changes

- [ ] Schema / index changes — **none required**.
- [ ] Access rule changes — **none required**.
- [ ] Environment variables — **none required**.
- [ ] Dependency changes — **none required** (`motion`, react-router, Tailwind
  tokens all already present).

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| Compare link accessible name becomes "VS Compare" and breaks the exact-name test | Med | Make the "VS" glyph decorative (`aria-hidden`) or set `aria-label="Compare"`; keep the accessible name exactly "Compare". |
| Portal card wrapping both name + invitation line in one `Link` changes the accessible name the test matches | Med | Test matches `new RegExp(displayName)` (substring), which still matches; assert exactly one link per player to catch accidental nested links. |
| Title stagger splits text in a way that fragments the heading's accessible name | Low | Keep all text inside a single `<h1>`; animate inner `motion.span` segments so the accessible name stays the full string. |
| Idle float/glow ignores reduced-motion preference | Low | Rely on the app-level `<MotionConfig reducedMotion="user">`; use preset-based variants that it can neutralize. |
| Title helper assumes exactly two players | Low | Join all `displayName`s with " & " and append the possessive; degrades cleanly for 1 or N players. |
| Deleting `PlaceholderGraphic` leaves a dangling import | Low | Grep confirms the only import is in `SplashPage`; remove both in the same change and rely on typecheck/lint. |
