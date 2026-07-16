# Proposal — Phase 2: Individual player stats page (#5)

## Executive Summary

Issue #5 replaces the placeholder `PlayerPage` (shipped as a stub in #4) with a real per-player
stats page at `/dad` and `/braidan`. The page reads the player's committed `latest.json` snapshot
and renders four sections — **Recent games**, **Most played**, **Most trophies**, and **Platinum
games** — using the pure stat functions already present in `src/stats` and exported through the
`psn` workspace package. This is a frontend-only change: the data and stats layers are already
sufficient, so no `src/psn` or `src/stats` logic is touched.

The approach normalizes all four sections onto a single presentational `GameSection` component fed
a common `{ id, iconUrl, name, metric }` view-model built in `PlayerPage`. That keeps the two
underlying domain shapes (`PlayedTitle`, `TrophyTitleStats`) at one mapping site, removes
duplication, and makes both the section component and the page straightforward to unit-test
against fixture snapshots. Presentation stays bare semantic HTML, consistent with the unstyled
#4 scaffold.

## Scope

### In Scope
- Real `PlayerPage` rendering the four spec'd sections from snapshot data.
- A reusable `GameSection` presentational component + `GameEntry` view-model.
- A UTC-pinned `formatDate` helper for the site.
- Graceful empty-state handling (configured player with no synced data; empty per-section lists).
- Component tests for the section and page, including the empty case.

### Out of Scope
- Any change to `src/psn` or `src/stats` logic (already sufficient per the issue).
- A CSS / visual styling system (deferred; scaffold is intentionally unstyled).
- Comparison page (#6) and analytics page (#7) — parallel tickets.
- Real synced snapshots (#8) — the page renders whatever `latest.json` holds; fixtures for now.

### One in-scope cross-file note
Re-exporting `sampleSnapshot` from `src/index.ts` (one line) so site tests can build against a
realistic fixture. This touches the public barrel only — not `src/psn` or `src/stats`.

## Acceptance Criteria

1. `PlayerPage` reads the player snapshot via `snapshotByKey(playerKey)`.
2. "Recent games" section rendered from `recentGames(snapshot)`.
3. "Most played" section rendered from `mostPlayedGames(snapshot)`.
4. "Most trophies" section rendered from `gamesWithMostTrophies(snapshot)`.
5. "Platinum games" section rendered from `platinumGames(snapshot)`, showing **all** results.
6. Each entry shows an icon (`imageUrl` for played, `iconUrl` for trophy titles), the game name,
   and the section's relevant metric (`formatMinutes` duration, trophy count, or a formatted date).
7. Empty-snapshot case renders a friendly empty state instead of crashing.
8. Component tests cover each section against a fixture snapshot and cover the empty case.
9. `site` lint, typecheck, test, and build all pass.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Player stats page: fixture export, `formatDate`, `GameSection` + tests, `PlayerPage` rewrite + tests | `src/index.ts`, `site/src/format.ts`, `site/src/components/`, `site/src/pages/` |

Single phase — the work is one cohesive frontend feature; staging it would not reduce risk or
improve reviewability.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Issue names `trophyTitleIconUrl`, which is the raw (not domain) field | Low | Use `iconUrl` on `TrophyTitleStats`; typecheck enforces it. |
| Fixture image URLs (`image.example`) don't resolve in a browser | Low | Every `<img>` carries `alt={name}`; real URLs arrive with #8. |
| Locale/timezone drift makes date-string test assertions flaky | Med | `formatDate` pins `timeZone: 'UTC'` with explicit `Intl` options. |
| Player has data but zero platinum games | Low | `GameSection` shows an empty-list message under its heading. |

## Effort Estimate

**Overall:** Small (1–2 days).

| Phase | Estimate |
|---|---|
| Phase 1 (build + tests + gate) | ~1 day |

Roughly half implementation, half tests + running the four-command site gate and root
verification.

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement Phase 1.
3. After the implementing PR merges, delete `.agents/issue-planner/5/` and close the issue.
