# Proposal — Phase 1: Site scaffold, routing, and splash page (#4)

## Executive Summary

This issue stands up the `site/` package: a Vite + React + TypeScript static frontend, converted into a pnpm workspace alongside the existing data-layer library, with `react-router`-based routing and a splash page linking to each player's stats and the comparison view. It is the foundation every other v1-site issue (#5 player page, #6 comparison page, #7 analytics page) builds on, and is itself unblocked.

The approach keeps this issue tightly scoped to scaffolding: `/dad`, `/braidan`, and `/compare` render minimal "Coming soon" placeholders rather than real data-driven pages, since those belong to #5 and #6. To keep the build green despite no real PSN snapshot data existing yet (`data/` currently holds only `.gitkeep`; real sync is the separate, parallel issue #8), this issue commits fixture snapshot data using the repo's existing `sampleSnapshot()` helper, clearly flagged as placeholder data pending #8. Test infrastructure (Vitest + React Testing Library) and CI wiring (lint/typecheck/test/build for `site`) are set up now so the scaffold ships in a genuinely working, testable state rather than a stub with skipped commands.

## Scope

### In Scope
- pnpm workspace conversion (`pnpm-workspace.yaml`)
- `site/` package scaffold (Vite + React + TS), consuming `src/stats` and domain types from the root package via `workspace:*`
- Routing for `/`, `/dad`, `/braidan`, `/compare`, driven by `psn.config.json` player keys
- Splash page with placeholder graphic and 3 links
- Minimal placeholder pages for `/dad`, `/braidan`, `/compare`
- Fixture snapshot data (`data/dad/latest.json`, `data/braidan/latest.json`) so the JSON-import task in the issue is provably wired
- Vitest + React Testing Library setup for `site`, with smoke tests for routing, splash page, and placeholder pages
- CI extended to lint, typecheck, test, and build `site`
- `AGENTS.md` documentation of `site` workspace commands

### Out of Scope
- Real per-player stats page content (#5)
- Real comparison page content (#6)
- Analytics page (#7)
- Real PSN snapshot sync (#8) — this issue only adds fixture placeholder data
- Any lint-enforced boundary preventing `site/` from importing `src/psn/` (currently convention-only; flagged as a possible future follow-up, not blocking)
- Final splash graphic asset (placeholder SVG only, explicitly flagged for replacement before launch)

## Acceptance Criteria

1. Root `package.json` becomes a pnpm workspace root (`pnpm-workspace.yaml` lists `site`); existing root package continues to build/test/lint unmodified
2. `site/` scaffolded with Vite + React + TypeScript, mirroring root's strict TS conventions
3. `site/` imports `src/stats` and domain types from the root package via `workspace:*`, never `src/psn/`
4. Fixture snapshots committed at `data/dad/latest.json` and `data/braidan/latest.json`, clearly flagged as placeholder pending #8
5. `react-router` wired with `/`, `/dad`, `/braidan`, `/compare`, generated from `psn.config.json` — no hardcoded player keys/paths
6. Splash page renders a placeholder graphic (commented as such) and 3 links to Dad's stats, Braidan's stats, and Compare
7. `/dad`, `/braidan`, `/compare` render "Coming soon" placeholders naming the relevant player(s)
8. `site` has its own lint/test/build scripts, runnable via `pnpm --filter site <script>`, documented in `AGENTS.md`
9. Vitest + React Testing Library configured for `site` with smoke tests covering splash page and all routes
10. `.github/workflows/ci.yml` extended to install, lint, typecheck, test, and build `site`

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Workspace conversion + fixture snapshot data | `pnpm-workspace.yaml`, `data/dad/`, `data/braidan/` |
| 2 | Site scaffold (Vite/React/TS config, workspace dependency) | `site/package.json`, `site/tsconfig.json`, `site/vite.config.ts` |
| 3 | Config, routing & pages | `site/src/config/`, `site/src/routes.ts`, `site/src/pages/`, `site/src/components/` |
| 4 | Testing | `site/src/**/*.test.tsx`, Vitest + RTL config |
| 5 | Scripts & CI | `site/package.json` scripts, `AGENTS.md`, `.github/workflows/ci.yml` |

Phases 1–2 are prerequisites for 3; 3 and 4 can be developed together (tests alongside components); 5 wraps up once everything else is green. Not parallelized across contributors, but ordered to keep each step buildable/testable before moving on.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Missing snapshot data breaks Vite build | High | Commit fixture snapshots now, reusing `sampleSnapshot()` (Decision 5 in design doc) |
| Fixture data confused with real synced data later | Medium | Explicit flagging in PR description and file provenance; #8 should overwrite, not append |
| Placeholder graphic shipped to production by mistake | Medium | Code comment + PR description flag, per issue's explicit instruction |
| Player key hardcoded despite "config-driven" requirement | Medium | Centralize all `psn.config.json` reads in `site/src/config/players.ts`; reviewed in code review |
| `site/tsconfig.json` drifts from root strictness | Low | Copy compiler options directly from root `tsconfig.json` |

## Effort Estimate

**Overall:** Small–Medium (2–3 days)

| Phase | Estimate |
|---|---|
| Phase 1 (workspace + fixtures) | 0.25 day |
| Phase 2 (site scaffold) | 0.5 day |
| Phase 3 (config, routing, pages) | 0.75 day |
| Phase 4 (testing) | 0.5 day |
| Phase 5 (scripts & CI) | 0.5 day |

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement phase by phase.
3. After implementation is merged, delete `.agents/issue-planner/4/` and close issue #4.
