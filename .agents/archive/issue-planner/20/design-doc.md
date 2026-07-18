# Design Doc — Phase 6: Motion polish — route transitions, 404 page, reduced-motion & a11y audit (#20)

## Overview

All four pages (Splash #17, Player #18, Compare #19) now live in the Design v1 language. This
issue is the milestone's **quality gate** before documentation (#21): it adds route-level page
transitions, designs the currently-unstyled 404 page, sweeps the four pages for consistency, and
runs a hard accessibility audit (contrast, reduced motion, keyboard focus). It is cross-cutting
polish — no new data, no new routes — over `site/` only.

## Acceptance Criteria

- [ ] AC1 — Route-level page transitions: `AnimatePresence` wraps the routed content in
  `site/src/App.tsx` (crossfade + slight rise on enter), instant under reduced motion; navigation
  must not break `site/src/routes.test.tsx`.
- [ ] AC2 — `NotFoundPage` designed: oversized ✕ glyph motif in the shape-cross token color with a
  glitch/flicker accent, "page not found" copy in the type scale, back-home CTA as a glowing
  `GlassCard` link.
- [ ] AC3 — Consistency sweep across all four pages: spacing rhythm, heading scale, card treatments,
  and animation timing all come from tokens/presets — any one-off values introduced during page
  work are removed.
- [ ] AC4 — Contrast audit: every token text/surface pair *used in the UI* meets WCAG AA (4.5:1
  body, 3:1 large text); token adjustments (if any) are made centrally in `theme.css`, not per usage.
- [ ] AC5 — Reduced-motion audit: with `prefers-reduced-motion: reduce`, every page renders complete
  and static — no content stuck invisible at an initial animation state.
- [ ] AC6 — Keyboard audit: logical focus order on every page, PS-blue `:focus-visible` ring on all
  interactive elements, decorative animations never receive focus.
- [ ] AC7 — Tests extended where assertable in jsdom: 404 content by role/name, presence of the
  back-home link; `routes.test.tsx` still green.
- [ ] AC8 — `pnpm --filter site lint`, `typecheck`, `test`, and `build` all pass.

## Architecture & Data Model

### Data Layer

**No data-layer changes.** This is `site/`-only presentational polish. `src/`, `data/`, and the
`psn` package are untouched; no snapshot, schema, or stats change.

### API / Service Layer

| Endpoint / Function | Type | Auth | Purpose |
|---|---|---|---|
| — | — | — | None. Static, client-rendered site over bundled snapshot JSON. |

### UI Component Tree

```
App  (site/src/App.tsx)
└─ AppShell                         [persistent header/nav — NOT animated]
   └─ AnimatePresence  mode="wait"  initial={false}   [NEW — AC1]
      └─ RouteTransition  key={location.pathname}      [NEW wrapper — crossfade + rise]
         └─ <Routes location={location}>
            ├─ SplashPage      (owns its internal stagger)
            ├─ PlayerPage      (owns its internal stagger)
            ├─ ComparePage     (owns its internal stagger)
            └─ NotFoundPage    [REDESIGNED — AC2]
```

New file:
- `site/src/components/RouteTransition.tsx` — the per-route crossfade+rise wrapper (reduced-motion
  aware). Keeps `App.tsx` thin and gives the transition a unit-testable home.

Redesigned file:
- `site/src/pages/NotFoundPage.tsx` — oversized flicker ✕ + copy + glowing back-home `GlassCard` link.

### Route transition mechanics (AC1)

`react-router` v7 + `AnimatePresence` requires the standard location-keyed pattern:

```tsx
// App.tsx (sketch)
const location = useLocation();
return (
  <AppShell>
    <AnimatePresence mode="wait" initial={false}>
      <RouteTransition key={location.pathname}>
        <Routes location={location}>…</Routes>
      </RouteTransition>
    </AnimatePresence>
  </AppShell>
);
```

- **`mode="wait"`** (Decision 1): the outgoing route fades/falls out, *then* the incoming route
  fades in and rises. No absolute positioning, no scroll/layout jump, and it keeps the DOM to a
  single routed page at a time — which is what `routes.test.tsx` asserts.
- **`initial={false}`**: suppresses the route-level enter animation on the very first paint, so the
  splash's own hero stagger is not doubled up. Route *changes* still animate.
- **`key={location.pathname}`**: drives enter/exit. Player routes share `PlayerPage` but differ by
  pathname, so `/dad` → `/braidan` still transitions.
- **Wrapper is keyed on `location.pathname`, and so is `<Routes location={location}>`** — passing the
  frozen `location` to `Routes` is what lets the *outgoing* tree keep rendering its old route during
  the exit animation (without it, `Routes` would immediately match the new path and there'd be
  nothing to animate out).
- **Reduced motion (AC5):** `RouteTransition` reads `useReducedMotion()` and collapses its transition
  to `duration: 0` (effectively instant) — content is always in the DOM at full opacity/position on
  first commit, never parked at `opacity: 0`. (`MotionConfig reducedMotion="user"` already neutralizes
  the *transform* rise; the opacity crossfade is gated here so reduced motion is truly instant.)
- **jsdom / tests:** Testing Library queries DOM presence, not computed opacity, and the incoming
  route is mounted synchronously — so `getByRole('heading', …)` resolves on the same tick. No timers,
  no `act` warnings expected; `mode="wait"` guarantees exactly one routed `<main>` in the tree.

### NotFoundPage design (AC2)

Composes existing primitives — no new tokens, no bespoke keyframes:

- **Oversized ✕ motif:** a large glyph/inline-SVG cross in `text-shape-cross` / `fill-shape-cross`,
  `aria-hidden`, sized from the type scale (`text-display` and up). The **flicker** reuses the
  existing `--animate-flicker` utility (`site/src/styles/theme.css:70`, applied via
  `motion-safe:animate-flicker` so it's automatically off under reduced motion — same pattern as the
  clash-meter bolt). No new `@keyframes`.
- **Copy:** an `<h1>` "Page not found" in the type scale + a muted supporting line, both from token
  utilities (`text-foreground` / `text-foreground-muted`).
- **Back-home CTA:** `GlassCard as={Link} to="/" glow` — the same glowing glass link pattern the
  splash portal cards use, giving a PS-blue focus ring and hover glow for free. Accessible name
  "Back to home" (or similar), located by role/name in tests.
- Layout mirrors the other pages' `main` container rhythm (`mx-auto max-w-… px-4 py-…`, centered).

### Consistency sweep (AC3)

A read-through of the four pages + shared components to normalize any one-offs introduced during
#17–#19 to tokens/presets:

| Axis | Source of truth | What to check |
|---|---|---|
| Spacing rhythm | Tailwind spacing scale; page `main` uses `max-w-5xl px-4 py-10/12` | Player uses `py-10`, Splash `py-12`, Compare empty-state `py-16` — reconcile to an intentional set, not ad-hoc drift |
| Heading scale | `--text-*` tokens (`text-3xl` … `text-display`) | All page `<h1>`s use `text-3xl sm:text-display`; section headers via `SectionHeader` |
| Card treatments | `GlassCard` (`glow` variant) | No hand-rolled `rounded-panel border … bg-surface-2` outside `GlassCard` |
| Animation timing | `motion/presets.ts` (`duration`, `easing`, `fadeRise`, `staggerChildren`, `glowPulse`) | No inline `duration:`/`ease:` literals except where composing a preset value (e.g. `duration.slow * N` for ambient loops, which is the established idiom) |

> The sweep is **corrective, not additive**: it removes drift, it does not restyle. Any change that
> alters a page's intended look is out of scope and, if genuinely needed, gets its own ticket
> (AGENTS.md "deferred work gets a ticket").

## Key Decisions

### Decision 1: Sequential route transition (`mode="wait"`), not overlapping crossfade

**Options considered:**
- Option A: `mode="wait"` — outgoing page animates out, then incoming animates in. No overlap.
- Option B: Overlapping crossfade (`mode="sync"` / `popLayout`) — both pages cross-dissolve at once.

**Decision:** Option A (`mode="wait"`).
**Rationale:** Option B requires absolute-positioning the routed content during the overlap, which
risks scroll/layout jumps on pages of different heights (Splash vs the long Player page) and makes
the DOM briefly contain two `<main>`s — directly at odds with `routes.test.tsx`, which asserts a
single page's heading per route. Option A delivers the AC's "crossfade + slight rise" (crossfade on
exit → rise on enter) with none of that risk, keeps scroll predictable, and needs no positioning
hacks. The feel is marginally less "seamless" but robust and test-safe. *(Raised as a clarifying
question; user declined to narrow, so taking the lower-risk default.)*

### Decision 2: Contrast — surgical fix, preserve the established #15 brand tokens

**Audit result** (computed; full table in Testing Strategy → Contrast matrix):

- `foreground`, `foreground-muted`, and all four trophy metals **pass AA body (4.5:1)** on every
  surface (surface-0…3, accounting for the translucent overlay blend). No change needed.
- `--color-ps-blue` (#0070d1) as **text** passes AA-large (≥3:1, e.g. the splash `text-display`
  headline) but **fails AA-body** (3.4–3.9:1) at small sizes. The only small-text usage is the
  AppShell "Stats" wordmark (`text-lg` = 18px bold — just under the 14pt-bold "large" threshold).
  `VsHero`'s ps-blue mark is a decorative `aria-hidden` SVG (non-text → 3:1 suffices, passes).
- Shape colors used as heading text (`SectionHeader`, per-player accent glyph) pass AA-large on the
  surfaces they appear on, with thin margins on `shape-cross`/`shape-circle`.

**Options considered:**
- Option A: Keep every brand token; route only the small-text ps-blue usage to a new accessible
  accent-text token (or `foreground`), leaving decorative/large brand blue untouched.
- Option B: Brighten `--color-ps-blue` globally so it clears 4.5:1 as body text everywhere.
- Option C: Verify-only; treat the wordmark as "large" and change nothing.

**Decision:** Option A.
**Rationale:** AGENTS.md flags the #15 palette as an established foundation ("never hardcode colors";
tokens are the contract). Option B repaints the site's signature accent on every surface, button,
glow, and focus ring to fix one wordmark — a disproportionate, milestone-visible change. Option C
leaves a real (if tiny) AA-body miss. Option A adds a single central token
`--color-ps-blue-text: #4c9ff0` (verified 6.86 / 6.02 / 5.49 : 1 on surfaces 0 / 2 / 3 — clears AA
body everywhere, stays unmistakably in the ps-blue family) and points the small-text usage at it via
a generated `text-ps-blue-text` utility. Decorative fills, glows, large headings, and the focus ring
keep the exact #0070d1 brand blue. Central token, no per-usage hex, no brand regression. *(Raised as
a clarifying question; user declined to narrow, so taking the lowest-risk option that still meets
AA.)*

### Decision 3: 404 flicker reuses `--animate-flicker`; no new keyframes

**Decision:** Drive the ✕ glitch/flicker with the existing `--animate-flicker` utility applied as
`motion-safe:animate-flicker`.
**Rationale:** The keyframe already exists (`theme.css:73`) and is the established motif for the
compare-page seam bolt; `motion-safe:` gates it off under reduced motion automatically (AC5) with no
JS. Reusing it keeps the "one system" feel and avoids a second flicker definition drifting from the
first.

### Decision 4: `RouteTransition` as a small dedicated component

**Decision:** Extract the keyed crossfade+rise wrapper into
`site/src/components/RouteTransition.tsx` rather than inlining `motion.div` in `App.tsx`.
**Rationale:** Keeps `App.tsx` a thin router, gives the reduced-motion gating one testable home, and
matches the repo's granular component style (`GlassCard`, `StatTile`, `ClashMeter`). App-level
wiring stays reviewable.

## Security & Permissions

No auth surface. Static, unauthenticated site rendering bundled fixture snapshots
(`site/src/data.ts`). No roles, tokens, access rules, or data-level controls are involved — none of
the security/auth scope questions apply.

## Error Handling

Presentational-only change; the meaningful "error" surface is the 404 route itself.

| Condition | Handling |
|---|---|
| Unmatched route (`path="*"`) | Redesigned `NotFoundPage` renders with a clear heading + back-home link (AC2). |
| Reduced motion active | Transitions collapse to instant; ambient loops (`flicker`, drift, glow pulse) are gated off; pages render complete and static (AC5). |
| Route change mid-animation | `mode="wait"` serializes exit→enter; a rapid second navigation just re-keys `AnimatePresence` — React reconciles to the latest `location.pathname`. |

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Routing | Component (existing) | `site/src/routes.test.tsx` | Must stay green with `AnimatePresence` in the tree — the four existing route assertions are the AC1 regression guard. |
| NotFoundPage | Component (new) | `site/src/pages/NotFoundPage.test.tsx` | Assert `heading /page not found/i` and a `link` named /back to home/i with `href="/"`; decorative ✕ is `aria-hidden` (not in the a11y tree). |
| RouteTransition | Component (optional/new) | `site/src/components/RouteTransition.test.tsx` | Renders children immediately (present in DOM on first commit); optional given `routes.test.tsx` already exercises it end-to-end. |
| Reduced motion / contrast / keyboard | Manual (browser) | — | Exceeds jsdom; verified via `pnpm --filter site dev` and documented in the PR "How to test" (browser-level automation is tracked separately in #14, not required here). |

### Contrast matrix (audit reference — computed, effective colors incl. overlay blend)

| Token (as text) | surface-0 | surface-2 | surface-3 | Verdict |
|---|---|---|---|---|
| `foreground` #eef1f7 | 16.9 | 14.8 | 13.5 | AA body ✅ |
| `foreground-muted` #9aa3b5 | 7.5 | 6.6 | 6.0 | AA body ✅ |
| trophy bronze/silver/gold/platinum | 4.9–14.9 | 5.3–13.1 | 4.9–11.9 | AA body ✅ |
| `ps-blue` #0070d1 | 3.9 | 3.4 | 3.1 | AA large only ⚠️ → small text uses `ps-blue-text` |
| **`ps-blue-text` #4c9ff0 (new)** | 6.9 | 6.0 | 5.5 | AA body ✅ |
| shape-cross / shape-circle (as heading text) | 3.6 / 3.8 | 3.2 / 3.3 | 2.9 / 3.0 | AA large where used ⚠️ (decorative-adjacent; verify usages sit on ≤surface-2) |

> Manual browser pass still required for reduced motion, keyboard order, and real navigation feel —
> jsdom cannot verify computed contrast, focus rings, or animation.

## Config Changes

- [ ] Schema / index changes — none required (static site, no DB).
- [ ] Access rule changes — none required.
- [ ] Environment variables — none required.
- [ ] Dependency changes — none required (`motion`, `react-router`, testing-library already present).
- [x] Design token change — add one central token `--color-ps-blue-text: #4c9ff0` in
  `site/src/styles/theme.css` (Decision 2). No existing token values change.

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| `AnimatePresence` breaks `routes.test.tsx` (two `<main>`s, delayed mount) | High | `mode="wait"` keeps one routed page; incoming mounts synchronously; assert on DOM presence, not opacity. Run `routes.test.tsx` first. |
| Splash double-animates on first load (route enter + own hero stagger) | Med | `initial={false}` on `AnimatePresence` suppresses the first-paint route enter. |
| Reduced motion leaves content parked at `opacity: 0` | High | `RouteTransition` collapses transition to `duration: 0`; content committed at full opacity; `motion-safe:` gates the flicker. |
| Changing `--color-ps-blue` would regress the milestone brand look | Med | Decision 2: brand token untouched; new `ps-blue-text` token only for small text. |
| Scroll position jumps between routes | Low | `mode="wait"` (no absolute positioning); if a scroll-to-top is desired it's a small, separately-scoped addition, not required by any AC. |
| Consistency sweep silently restyles a page | Med | Sweep is corrective (remove drift) only; any intentional restyle is out of scope → new ticket per AGENTS.md. |
| Shape-color heading on a too-light surface fails AA-large | Low | Audit confirms current usages sit on ≤surface-2 (pass); flag if any lands on surface-3. |
