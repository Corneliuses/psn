# Proposal — Phase 2: Component kit — trophy badges, stat tiles, animated numbers, GameSection redesign (#16)

## Executive Summary

Phase 2 of the Design v1 milestone builds the reusable PlayStation-styled component kit that every
later page redesign composes: `GlassCard` (the shared elevated glassy surface), `TrophyBadge`,
`StatTile`, `AnimatedNumber`, `SectionHeader`, and a visual redesign of the existing `GameSection`.
Each primitive is built on the Phase 1 foundation — design tokens in `site/src/styles/theme.css`
and Motion presets in `site/src/motion/presets.ts` — with no one-off colors, durations, or easings.

Because this issue is the sole gate between the foundation and the page work (#17/#18/#19), the
emphasis is correctness and accessibility over breadth: `GameSection` keeps its exact DOM semantics
under a new skin, and `AnimatedNumber` is engineered to render its final value immediately in jsdom
and under reduced motion. No primitive is wired into a page here — that is deferred to the page
phases. This keeps the diff self-contained and reviewable.

## Scope

### In Scope
- `GlassCard`, `TrophyBadge`, `StatTile`, `AnimatedNumber`, `SectionHeader` primitives in
  `site/src/components/`.
- Visual redesign of `GameSection` preserving its public API (`GameEntry` unchanged) and asserted
  a11y semantics.
- Component tests for every new primitive; keeping the existing `GameSection` suite green.
- Green `lint` / `typecheck` / `test` / `build` for the `site` workspace.

### Out of Scope
- Wiring any primitive into `SplashPage`, `PlayerPage`, or `ComparePage` (issues #17/#18/#19).
- Any change to `GameEntry`, `PlayerPage`'s `sectionEntries` mapping, or the data layer.
- Real snapshot data / sync; fixture icon URLs remain non-resolving by design.
- Visual-regression/snapshot baselines (the suite is behavioral Testing-Library, not visual).

## Acceptance Criteria

1. `GlassCard` renders an elevated glassy surface with hover lift and an optional PS-blue glow
   variant, using only token utilities.
2. `TrophyBadge` renders the tier icon + count in trophy-metal token colors with an accessible
   label naming the tier (e.g. "3 platinum trophies").
3. `StatTile` renders a big animated number + label and animates in via the shared `fadeRise` preset.
4. `AnimatedNumber` renders the final value immediately under reduced motion and in jsdom tests
   (asserted with no timers), and counts up in real browsers.
5. `SectionHeader` renders a heading with a decorative, `aria-hidden` PS-shape glyph rotating
   through △ ○ ✕ □.
6. `GameSection` is redesigned into staggered card rows (icon tile, name, metric, hover lift + glow)
   while still passing its existing tests (heading role, one `listitem` per game, empty-alt
   decorative icon, empty-state paragraph with `emptyLabel` fallback).
7. Every new primitive has component tests; `site` lint, typecheck, test, and build all pass.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Leaf primitives: `GlassCard`, `AnimatedNumber`, `TrophyBadge`, `SectionHeader` + tests | `site/src/components/` |
| 2 | Composites + redesign: `StatTile`, `GameSection` + tests | `site/src/components/` |

> Single `site` package — phases are implementation/review order and can ship as **one PR** unless
> the diff grows large enough to warrant splitting.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Motion components render at initial state in jsdom, breaking assertions | Med | `AnimatedNumber` paints the final value first (progressive-enhancement count-up); tests assert text/roles, never opacity/transform. |
| Redesign breaks `GameSection`'s asserted a11y contract | Med | Preserve exact DOM roles; existing test file is the unchanged gate. |
| One-off durations/easings/hex colors creep into components | Low | Use only theme token utilities + shared `motion/presets.ts`; lint & review gate. |
| Fixture icons render as broken images | Low | Neutral surface tile behind each `img alt=""`. |
| `GlassCard` can't nest inside `<li>` | Low | Polymorphic `as` (default `div`); nested inside `<li>`, not replacing it. |

## Effort Estimate

**Overall:** Small–Medium (2–3 days) — six components + six test files in one package, no
data/infra/auth work. Roughly half the effort is tests and getting Motion-in-jsdom behavior right.

| Phase | Estimate |
|---|---|
| Phase 1 (leaf primitives + tests) | ~1–1.5 days |
| Phase 2 (composites + GameSection redesign + tests) | ~1–1.5 days |

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement — Phase 1 primitives, then Phase 2 composites/redesign.
3. Run the pre-commit gate (`pnpm --filter site lint|typecheck|test|build`) before committing.
4. After the implementing PR merges, delete `.agents/issue-planner/16/` and close #16.
