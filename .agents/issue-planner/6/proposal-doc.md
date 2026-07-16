# Proposal — Phase 3: Head-to-head comparison page (#6)

## Executive Summary

Build the `/compare` page that renders the full Dad-vs-Braidan head-to-head: a per-metric scoreboard
with winner indicators and a shared-games breakdown. This is deliberately thin frontend work — the
data layer already does the hard part. `comparePlayers(a, b)` (`src/stats/compare.ts`) returns a
fully UI-ready `Comparison` (players, totals, per-metric winners, and a pre-sorted shared-games
list), so the phase is just: select both players' snapshots, hand the computed `Comparison` to two
small presentational components, and cover the behavior with fixture-based component tests.

The approach follows the pattern established by the #5 player page: the page owns data selection and
layout; lean, single-responsibility presentational components (`Scoreboard`, `SharedGames`) render
the tables and are unit-tested in isolation. Consistent with the rest of the site, presentation
stays bare semantic HTML — the "visual winner indicator" is realized as a winner cell plus a
`data-winner` attribute (a hook a future styling ticket can target), not new CSS.

## Scope

### In Scope
- Real `/compare` page replacing the "Coming soon" stub.
- Metrics scoreboard: label, both players' values, winner indicator (with explicit tie handling).
- Shared-games table: name, each player's playtime and trophies earned, in the returned order.
- Graceful empty states: zero shared games, and missing/unsynced snapshots.
- Component tests against `sampleSnapshot('dad', …)` vs `sampleSnapshot('braidan', …)`.

### Out of Scope
- Any change to `comparePlayers` or the `src/stats` / `src/psn` data layer (already sufficient).
- CSS / visual styling of the scoreboard (whole-site concern; a `data-winner` hook is left for it).
- Player page (#5) and analytics page (#7) — parallel, independent phases.
- Real synced snapshots (#8) — the page reads whatever `snapshotByKey` returns.

## Acceptance Criteria

1. `ComparePage` calls `comparePlayers` with both players' snapshots (selected from config).
2. `comparison.metrics` renders as a scoreboard with label, both values, and a winner indicator.
3. `comparison.sharedGames` renders (name, per-player playtime + trophies) in the returned order.
4. Ties (`winner === 'tie'`) render neutrally, not as a win for either player.
5. Zero shared games renders a friendly empty state.
6. Missing/unsynced snapshot renders a friendly empty state (no crash, `comparePlayers` not called).
7. Component tests cover the scoreboard, a tie, shared games, and the empty states against fixtures.
8. `site` lint, typecheck, test, and build all pass.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Comparison page — two presentational components + page wiring + tests (single cohesive phase) | `site/src/components/`, `site/src/pages/` |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Tie defaults to a win for player a | Med | Explicit `winner === 'tie'` → neutral "Tie" cell (AC4). |
| Page crashes when a snapshot is missing | Med | Guard before calling `comparePlayers`; render empty state (AC6). |
| Playtime shown as raw minutes, inconsistent with player page | Low | `formatMinutes` for playtime rows only. |
| Shared-games order changed by client-side sorting | Low | Render the list as returned; never re-sort in the view. |

## Effort Estimate

**Overall:** Small (1 day).

| Phase | Estimate |
|---|---|
| Phase 1 (components + page + tests) | ~1 day incl. tests, gate, and review cycle |

## Open Decisions (defaults chosen, reversible at review)

Two UI choices were resolved to the repo's established defaults rather than blocking; either can be
flipped at approval with only `Scoreboard.tsx` affected:

- **Winner indicator:** semantic HTML + `data-winner` hook, no new CSS (matches the whole site).
  Alternative: introduce a styled CSS scoreboard (widens scope beyond this phase).
- **Playtime format:** humanized via `formatMinutes` (matches the player page).
  Alternative: raw minutes.

## Next Steps

1. Review and approve this proposal (confirm the two open-decision defaults above).
2. Follow `task-doc.md` to implement the single phase.
3. After the PR merges, delete `.agents/issue-planner/6/` and close the issue.
