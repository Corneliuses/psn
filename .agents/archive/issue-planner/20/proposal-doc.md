# Proposal — Phase 6: Motion polish — route transitions, 404 page, reduced-motion & a11y audit (#20)

## Executive Summary

Phase 6 is the Design v1 milestone's **quality gate** before documentation (#21). With all four
pages now in the PlayStation-vibe design language (#17 Splash, #18 Player, #19 Compare), this issue
adds the finishing pass: route-level page transitions, a designed 404 page, a cross-page consistency
sweep, and a hard accessibility audit covering contrast, reduced motion, and keyboard focus. It is
`site/`-only presentational polish — no new data, routes, or dependencies.

The approach favors robustness over flash: sequential (`mode="wait"`) route transitions that keep
scroll predictable and the routing tests green, and a **surgical contrast fix** that adds a single
accessible accent-text token rather than repainting the established brand blue. A pre-flight WCAG
audit already confirmed the palette is almost fully AA-compliant — the one real miss (`ps-blue` used
as small text) is fixed centrally in `theme.css` with zero change to the site's signature look.

## Scope

### In Scope
- Route-level page transitions via `AnimatePresence` in `App.tsx` (crossfade + rise, instant under
  reduced motion), without breaking `routes.test.tsx`.
- Redesigned `NotFoundPage`: oversized flicker ✕ motif, type-scale copy, glowing back-home
  `GlassCard` link, plus jsdom tests.
- Consistency sweep across all four pages (spacing, heading scale, card treatments, animation timing
  → tokens/presets).
- Accessibility audit: WCAG-AA contrast (central token adjustment only where needed), reduced-motion
  completeness, keyboard focus order + visible focus ring.

### Out of Scope
- Any intentional restyle of an existing page (the sweep is corrective, not additive → separate
  ticket if needed, per AGENTS.md).
- Browser-level automated test coverage (contrast/keyboard/navigation) — tracked in #14; verified
  manually here and documented in the PR.
- Design documentation — that is Phase 7 / #21, which this issue unblocks.
- Any `src/`, `data/`, or `psn`-package change.

## Acceptance Criteria

1. Route-level page transitions: `AnimatePresence` wraps routed content in `App.tsx` (crossfade +
   rise on enter), instant under reduced motion; `routes.test.tsx` still passes.
2. `NotFoundPage` designed: oversized ✕ glyph in `shape-cross` with a glitch/flicker accent, "page
   not found" copy in the type scale, back-home CTA as a glowing `GlassCard` link.
3. Consistency sweep: spacing, heading scale, card treatments, and animation timing all sourced from
   tokens/presets; one-off values removed.
4. Contrast audit: every token text/surface pair used in the UI meets WCAG AA (4.5:1 body, 3:1
   large); adjustments made centrally in `theme.css`.
5. Reduced-motion audit: with `prefers-reduced-motion: reduce`, every page renders complete and
   static — no content stuck invisible.
6. Keyboard audit: logical focus order, PS-blue `:focus-visible` ring on all interactive elements,
   decorative animations never focusable.
7. Tests extended where assertable in jsdom (404 content by role/name, back-home link present).
8. `pnpm --filter site lint`, `typecheck`, `test`, and `build` all pass.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Route transitions (`RouteTransition` + `AnimatePresence` wiring) | `site/src/App.tsx`, `site/src/components/RouteTransition.tsx` |
| 2 | NotFoundPage redesign + tests | `site/src/pages/NotFoundPage.tsx`, `…/NotFoundPage.test.tsx` |
| 3 | A11y & consistency audit (contrast token, sweep, reduced-motion, keyboard) | `site/src/styles/theme.css`, `site/src/components/AppShell.tsx`, all four pages |
| 4 | Tests + gate + manual verification notes | `site/src/routes.test.tsx`, PR "How to test" |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `AnimatePresence` breaks routing tests (two pages mounted / delayed mount) | High | `mode="wait"` keeps one routed `<main>`; incoming mounts synchronously; assert DOM presence not opacity. Run `routes.test.tsx` first. |
| Reduced motion leaves content parked at `opacity: 0` | High | `RouteTransition` collapses transition to `duration: 0`; `motion-safe:` gates the 404 flicker. |
| Splash double-animates on first paint | Med | `initial={false}` on `AnimatePresence`. |
| Contrast fix regresses the milestone brand blue | Med | Add `--color-ps-blue-text` (#4c9ff0) for small text only; leave `--color-ps-blue` and all glows/large headings untouched. |
| Consistency sweep silently restyles a page | Med | Sweep is corrective (remove drift) only; intentional restyles are out of scope → new ticket. |

## Effort Estimate

**Overall:** Small–Medium (2–3 days), most of it manual browser a11y verification, not code.

| Phase | Estimate |
|---|---|
| Phase 1 — route transitions | ~0.5 day |
| Phase 2 — 404 redesign + tests | ~0.5 day |
| Phase 3 — a11y & consistency audit | ~1 day (manual reduced-motion + keyboard passes dominate) |
| Phase 4 — tests, gate, PR notes | ~0.5 day |

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement phase by phase.
3. After the PR merges, archive `.agents/issue-planner/20/` and close the issue (it unblocks #21).
