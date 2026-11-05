# Proposal — Phase 1: Roster foundation — add Nadia to config, data, and sync (#41)

## Executive Summary

Add Nadia as a third configured player. Because routes, nav, splash portal cards, shape accents,
and the e2e smoke suite all derive from `psn.config.json`, the `/nadia` page, its nav link, its
portal card, and its ✕ accent all appear from the config entry alone. The substantive work is the
plumbing still hardcoded to `dad`/`braidan`: the site's two literal snapshot imports become an
eager `import.meta.glob` over `data/*/latest.json`, and the sync workflow gains an `NPSSO_NADIA`
env entry.

Code exploration surfaced one gap the issue's task list assumes away: `sampleSnapshot('nadia', …)`
**throws today**, because `sampleRawResponses` (`src/fixtures/sample.ts:79-83`) only knows `dad`
and `braidan`. So both the placeholder `data/nadia/latest.json` and the `pnpm sync --dry-run`
verification step are blocked until `src/fixtures/sample.ts` gains a Nadia library — that is the
first task, not an afterthought. Her fixture is overlap-rich (one title shared with both players,
one with each, one unique) so the shared-games, compare, and shared-genre paths that #42/#43/#46
build on have real fixture coverage from day one.

## Scope

### In Scope

- `psn.config.json` — third player entry with `NPSSO_NADIA` auth.
- `src/fixtures/sample.ts` — Nadia's raw played/trophy library, plus the `RAW` record entry.
- `data/nadia/latest.json` — committed placeholder fixture snapshot, clearly flagged.
- `site/src/data.ts` — glob-based snapshot loading keyed by player directory name.
- `site/src/data.test.ts`, `site/src/config/players.test.ts`, `test/map.test.ts` — config-driven
  test coverage.
- `.github/workflows/sync.yml`, `.env.example`, `README.md` secrets list — `NPSSO_NADIA` wiring.
- `site/src/pages/SplashPage.tsx` — portal-card grid columns, so the third card isn't orphaned.
- `AGENTS.md` + `site/src/data.ts` comment — correct the now-stale claim that Dad's and Braidan's
  snapshots are fixture data (they hold real synced data as of 2026-07-19).

### Out of Scope

- Compare-page pair selection and the splash VS banner — both still show only the first two
  configured players. **Deferred to #43.**
- Family/relationship language across the site copy. **Deferred to #45.**
- Discover-page behaviour with a three-player roster. **Deferred to #46.**
- Documentation rewrites beyond the secrets list. **Deferred to #47.**
- Stats-module roster comparison. **#42, runs in parallel.**
- Relaxing `sharedGenres`' all-players intersection rule. **New follow-up issue.**
- Making `pnpm sync --dry-run` stop writing over real snapshots. **New follow-up issue.**

## Acceptance Criteria

1. `psn.config.json` contains `{ key: "nadia", displayName: "Nadia", auth: { mode: "npsso",
   envVar: "NPSSO_NADIA" } }` as the third player.
2. `src/fixtures/sample.ts` provides a Nadia raw library, so `sampleSnapshot('nadia', …)` and
   `sampleRawResponses('nadia')` resolve instead of throwing.
3. `data/nadia/latest.json` is committed as a `sampleSnapshot()`-generated placeholder, explicitly
   flagged as fixture data pending her first real sync.
4. `site/src/data.ts` loads every player's `latest.json` via an eager `import.meta.glob` over
   `../../data/*/latest.json` keyed by directory name — no per-player import statements remain.
5. `site/src/data.test.ts` asserts that every player in `psn.config.json` resolves a snapshot with
   a matching `player.key`, rather than naming `dad`/`braidan` literally.
6. `.github/workflows/sync.yml` passes `NPSSO_NADIA: ${{ secrets.NPSSO_NADIA }}`, with its header
   comment updated for a three-token roster.
7. The splash portal-card grid accommodates a three-player roster without an orphaned card,
   driven by roster size rather than a hardcoded 3.
8. All gates green: root and site `lint`/`typecheck`/`test`/`build`, the e2e smoke suite (which
   auto-covers `/nadia`), and `pnpm sync --dry-run` exiting 0 across all three players.
9. The repo owner adds the `NPSSO_NADIA` Actions secret (manual, out-of-band).

## Implementation Phases

Three dependency-ordered stages in **one PR**, not three PRs.

| Stage | Description | Areas Affected |
|---|---|---|
| 1 | Fixtures → config → snapshot → workflow/secrets wiring | `src/fixtures/`, `psn.config.json`, `data/nadia/`, `test/`, `.github/workflows/`, `.env.example`, `README.md` |
| 2 | Glob-based snapshot loading + config-driven tests + splash grid | `site/src/data.ts`, `site/src/data.test.ts`, `site/src/config/`, `site/src/pages/SplashPage.tsx` |
| 3 | Comment/doc hygiene + follow-up issues | `AGENTS.md`, GitHub issues |

## Key Decisions

| Decision | Chosen | Why |
|---|---|---|
| Nadia's fixture library | Overlap-rich, ~4 titles | Required regardless (`sampleSnapshot` throws today); overlap makes three-way compare/shared-genre logic testable for #42/#43/#46. An empty snapshot would fail the e2e smoke's visible-metric assertion |
| Snapshot loading | `import.meta.glob`, not a third import | Player #4 needs no change here; mirrors the dated-history glob at `site/src/data.ts:37-39` |
| Missing `NPSSO_NADIA` | Accept red nightly runs | `sync.ts` isolates per-player failures, so Dad/Braidan data still commits; the red run *is* the alert, per the workflow's own stated design |
| Splash vs. compare | Fix the grid, defer the pair logic | The orphaned card is a regression this PR introduces; pair selection is a product question #43 exists to answer |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `sampleSnapshot('nadia')` throws — the issue's task list assumes it works | High | Fixture library is task #1; everything else depends on it |
| `pnpm sync --dry-run` overwrites Dad's and Braidan's **real** snapshots with fixture data (`src/cli/sync.ts:81`) | High | Run the dry run last, then `git checkout -- data/dad data/braidan` and verify `git status --porcelain data/` shows only `data/nadia/latest.json`. Pre-existing hazard — follow-up issue filed |
| `sharedGenres` requires *every* player to have time in a genre, so a third player narrows suggestions toward empty | Medium | Accepted for Phase 1; follow-up issue filed and linked from #46 |
| Nightly sync red until the secret is added | Medium | Accepted; per-player isolation keeps the other two players' data flowing |
| Stale `FIXTURE DATA` comments claim real snapshots are fixtures | Low (misleading) | Corrected in `site/src/data.ts` and `AGENTS.md` as part of this change |
| Nadia absent from `/compare` and the splash VS banner | Low (intended) | Deferred to #43, called out in the PR body so it reads as a decision, not an oversight |
| Glob silently yields `undefined` for a typo'd config key | Low | AC5's config-driven test fails loudly in CI |

## Effort Estimate

**Overall:** Small (1–2 days), including tests, the full two-workspace gate, the e2e run, and PR
review cycles.

| Stage | Estimate |
|---|---|
| Stage 1 — fixtures, config, snapshot, workflow | ~0.5 day (the fixture library is most of it) |
| Stage 2 — glob loader, tests, splash grid | ~0.5 day |
| Stage 3 — docs, hygiene, follow-up issues | ~0.25 day |
| Gates + review cycles | ~0.25–0.75 day |

The manual `NPSSO_NADIA` secret step is out-of-band and does not block the PR.

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` stage by stage.
3. Repo owner adds the `NPSSO_NADIA` Actions secret and triggers a manual sync to replace the
   placeholder snapshot with real data.
4. After the PR merges, delete `.agents/issue-planner/41/` and close #41, unblocking #43, #45,
   #46, and #47.
