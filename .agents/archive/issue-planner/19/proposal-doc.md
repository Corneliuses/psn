# Proposal — Phase 5: Compare page — head-to-head VS showdown (#19, closes #6)

## Executive Summary

We're building `/compare` from its current "Coming soon." stub into the design showcase of the
Design v1 milestone: a VS hero pitting the two configured players against each other, an animated
head-to-head scoreboard, a dedicated trophy-tier block, and a shared-games deep list. All of it is
driven by the already-complete `comparePlayers` data layer (`src/stats/compare.ts`), whose edge
cases — ties, an empty opponent, cross-platform name normalization — are already pinned by
`test/stats.test.ts`. This PR delivers the full visual design and closes #6 (the functional compare
feature) as well.

The core interaction is a per-metric **clash meter**: one contested track with a glowing
lightning/spark seam at the proportional division (`a / (a+b)`), pushed toward whoever's ahead. The
winning side is saturated in that player's accent and glows while the loser's side eases back gently;
ties render neutral (seam dead-center, no glow), which also cleanly handles the always-tied
shared-games count and any zero/zero tier. The spark seam deliberately reuses the VS hero's lightning divider so the
page reads as one system, with the count-up numbers at each end as the assertable source of truth.
Trophy tiers get their own visually distinct block tinted with the trophy metal tokens.

## Scope

### In Scope
- Full rewrite of `site/src/pages/ComparePage.tsx` and new compare-specific components under
  `site/src/components/`.
- VS hero, animated metric scoreboard, trophy-tier block, shared-games deep list.
- Styled empty states for a missing snapshot and for zero shared games.
- Component tests for the new components and the page.

### Out of Scope
- Any change to the `comparePlayers` data layer or its types (complete; independently tested).
- Player selection UI / comparing arbitrary pairs — the page compares the two configured players in
  config order (deferred; not requested).
- Real synced snapshot data (fixtures today; issue #8 replaces them).
- Motion polish beyond the shared presets — that is #20 (Phase 6), which this issue blocks.

## Acceptance Criteria

1. Page calls `comparePlayers(a, b)` with the two `snapshotByKey` snapshots in config order.
2. A missing snapshot for either player renders a styled empty state (no crash).
3. VS hero shows both display names with per-player accents and a decorative (`aria-hidden`) spark
   divider, entering with a staggered animation.
4. Metric scoreboard renders `comparison.metrics` as clash meters: label, both count-up values, and a
   glowing spark seam at the proportional division; the winner's side glows in that player's accent
   and the loser's dims, driven by `metric.winner`.
5. `winner === 'tie'` renders neutrally (no glow toward either side) — explicit test.
6. Trophy-tier metrics render in a dedicated block using `TrophyBadge` metal colors.
7. Shared-games deep list renders name, each player's playtime (`formatMinutes`) and trophies, in
   `GlassCard` rows.
8. Zero shared games renders a styled empty state — explicit test.
9. Component tests against `sampleSnapshot('dad', …)` vs `sampleSnapshot('braidan', …)` cover winner
   indication, the tie case, and the zero-shared-games case.
10. `pnpm --filter site` lint, typecheck, test, and build all pass.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Compare-specific components + their tests | `site/src/components/` |
| 2 | Compose the page + page test + empty states | `site/src/pages/` |

> Two phases only for reviewability (build the reusable pieces, then wire them up) — not a hard
> dependency split. Both land in a single PR.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Missing snapshot crashes the compare call | Med | Guard and render the empty state before calling `comparePlayers`; explicit test. |
| Seam animation breaks jsdom/reduced-motion tests | Med | Render final seam position immediately when not animatable (AnimatedNumber pattern); assert on text values, not geometry. |
| Zero/zero metric divides by zero in seam math | Low | `a+b===0` → seam centered at `0.5`, no glow. |
| Winner glow uses the wrong player accent | Low | `accentForKey(players[i].key)`, config order — same source as PlayerPage/Splash. |
| Data layer later reorders `metrics` | Low | Group rows by `metric` key, never by array index. |

## Effort Estimate

**Overall:** Small–Medium (2–3 days)

| Phase | Estimate |
|---|---|
| Phase 1 — components + tests | 1.5 days |
| Phase 2 — page + tests + empty states + green gate | 1 day |

Effort is mostly the visual/animation design and test coverage; the data layer and component kit
are already done, which keeps this contained.

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement Phase 1 then Phase 2.
3. Run the pre-commit gate (`pnpm --filter site` lint/typecheck/test/build) green before committing.
4. Open the PR (closes #6 and #19); after it merges, delete `.agents/issue-planner/19/` and confirm
   both issues are closed.
