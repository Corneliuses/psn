# Proposal — Phase 4: Analytics (#7)

## Executive Summary

Phase 4 adds the four v1 analytics views over the committed snapshot history:
playtime trends over time, trophy-earning pace, a per-player completion scoreboard,
and an expanded shared-games deep dive. The stats are pure functions in `src/stats`
(snapshot(s) in, plain data out) following the existing `recent`/`mostPlayed`/
`trophies` pattern, plus one Node-side history reader (`readAllSnapshots`) and a
matching build-time history loader for the static site. The views are split across
the pages where they belong: trends, pace, and completion on each `PlayerPage`; the
shared-games deep dive on `ComparePage`.

Because trend and pace need multiple dated snapshots — and only `latest.json` is
committed until auto-sync (#8) runs — the code is built to render gracefully sparse
today (single-point trend, empty pace) and fill in automatically as history
accumulates, with no later rework. The site's build-time glob picks up new dated
snapshots the moment #8 commits them.

## Scope

### In Scope
- `readAllSnapshots(baseDir, playerKey)` full-history reader in `src/snapshot/store.ts`.
- `playtimeTrend`, `trophyPace` (`src/stats/trends.ts`).
- `completionScoreboard` (`src/stats/completion.ts`).
- `sharedGamesDeepDive` (additive export in `src/stats/compare.ts`).
- Shared `nameKey` normalizer extracted to `src/stats/names.ts`.
- Build-time multi-snapshot loader `snapshotsByKey` in `site/src/data.ts`.
- UI split across pages: `TrendChart`, `TrophyPaceList`, completion (via `StatTile` +
  `GameSection`) on `PlayerPage`; `SharedGamesDeepDive` on `ComparePage`.
- Fixture-based unit tests for every new function (incl. single-snapshot/empty) and
  component tests for every new primitive.

### Out of Scope
- Real snapshot history / auto-sync (#8) — trends stay sparse until it lands.
- Any `PlayerSnapshot` schema change or `schemaVersion` bump.
- New charting dependency — the trend line is a hand-rolled accessible SVG.

## Acceptance Criteria

1. `readAllSnapshots` returns every dated snapshot for a player, oldest → newest (`[]` for unknown player, `latest.json` excluded).
2. `playtimeTrend(snapshots)` returns per-snapshot total playtime oldest → newest; safe on single/empty input.
3. `trophyPace(snapshots)` returns per-tier trophy deltas between consecutive snapshots; `[]` for fewer than two snapshots.
4. `completionScoreboard(snapshot)` returns near-platinum (`progress >= 90 && !hasPlatinum`), untouched-backlog count, and average progress.
5. `sharedGamesDeepDive(a, b)` adds playtime gap, trophy gap, and "played more recently" per shared game.
6. Every new pure function has fixture-based tests, explicitly covering single-snapshot and empty cases.
7. The four views render split across `PlayerPage` and `ComparePage`, reusing the kit and passing the AGENTS.md ship checklist.
8. Root and `site/` lint, typecheck, test, and build all pass.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Data & stats: `readAllSnapshots`, trends/completion/deep-dive pure functions, shared `nameKey`, unit tests | `src/snapshot/`, `src/stats/`, `test/` |
| 2 | Site UI: build-time history loader, new components, page wiring, component/page tests | `site/src/data.ts`, `site/src/components/`, `site/src/pages/` |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Only `latest.json` on disk today → sparse trends | Med | Site fallback renders a single-point trend; UI shows a static "not enough history yet" state; single-snapshot tests lock the behaviour. |
| `latest.json` double-counted in history | Med | Both readers enumerate dated files only; a unit test asserts exclusion. |
| Cross-platform title-name mismatch (PS4/PS5) | Med | Shared `nameKey` normalizer reused for backlog matching and the deep dive. |
| Breaking the compare data contract | Med | `sharedGamesDeepDive` is additive; `comparePlayers`/`SharedGame` untouched. |
| New charts under reduced motion / jsdom | Med | `TrendChart`/`TrophyPaceList` resolve to a complete static state; component tests assert final state. |

## Effort Estimate

**Overall:** Medium (3–5 days)

| Phase | Estimate |
|---|---|
| Phase 1 — data & stats + tests | 1.5–2 days |
| Phase 2 — site UI + component/page tests | 2–3 days |

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement phase by phase.
3. After implementation is merged, delete `.agents/issue-planner/7/` and close the issue.
