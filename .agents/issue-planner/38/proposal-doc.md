# Proposal — Phase 7: Game suggestions for titles we don't own (#38)

## Executive Summary

We're building the v2 "Discover" feature: suggest games *neither* player owns, based on the genres
they actually play most (weighted by playtime), using the RAWG catalog API. A new `src/suggestions/`
module reads the committed snapshots at sync time, matches owned titles to RAWG genres, fetches
highly-rated unowned PS4/PS5 games in the top *shared* genres, and writes a committed
`data/suggestions.json`. A new **Discover** page in `site/` renders those suggestions, linked back to
RAWG with the required attribution.

The approach ports the already-working logic from the Phase 6 spike (`scripts/spike-suggestions.ts`,
RAWG path only) into product code, adds no new npm dependencies (Node 22 `fetch`), and leaves
`PlayerSnapshot`/`schemaVersion` untouched. A persisted title→genre cache keeps steady-state RAWG
usage to a handful of requests per sync, and the refresh is wired into the existing daily sync
workflow.

## Scope

### In Scope
- RAWG fetch + genre-profiling layer (`src/suggestions/fetch.ts`, `stats.ts`).
- Sync-time integration: `pnpm sync` refreshes suggestions; `--no-suggestions` opts out.
- Persisted title→genre cache (`data/suggestions-cache.json`) and atomic write of
  `data/suggestions.json`.
- Curated overrides escape hatch (`data/suggestions-overrides.json`, gitignored).
- New **Discover** route + `Suggestions` component with RAWG links and attribution.
- Unit + integration tests; `RAWG_API_KEY` wired into `.github/workflows/sync.yml`.

### Out of Scope
- IGDB integration (spike compared it; RAWG chosen).
- Changes to `psn-api` usage or `getPurchasedGames`-based ownership (owned = filtered
  `playedTitles`, per the issue).
- Batch request queuing for higher sync cadence (deferred; noted in the spike as a future
  optimization — file a follow-up issue only if cadence actually increases).
- Removing/retiring `scripts/spike-suggestions.ts` (kept as #9's record until a later cleanup).

## Acceptance Criteria

1. Fetch layer matches owned PS4/PS5 titles to RAWG genres and fetches highly-rated unowned games
   per top shared genre, respecting rate limits (≥120 ms spacing; 20k/month cap).
2. `pnpm sync` refreshes `data/suggestions.json` atomically after the PSN sync; `--no-suggestions`
   skips it; a missing `RAWG_API_KEY` skips with a warning and leaves the file untouched.
3. Stats compute top genres per player (by playtime hours), shared genres, and per-genre counts
   (top 3 genres/player).
4. No change to `PlayerSnapshot`/`schemaVersion`; a sample `suggestions.json` ships in
   `src/fixtures/`.
5. A **Discover** route shows top shared genres and 5–10 suggestions each, linking to
   `https://rawg.io/games/{rawgId}`, with "Data from [RAWG](https://rawg.io)" attribution.
6. Curated overrides (gitignored) hide/add entries, applied before the final write.
7. Mocked-RAWG unit tests + a sync integration test; lint/typecheck/test/build green for root and
   `site/`.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Data layer — fetch, stats, cache, overrides, store, fixtures + unit tests | `src/suggestions/`, `src/fixtures/`, `test/`, `package.json` |
| 2 | Sync CLI integration + CI wiring + integration test | `src/cli/sync.ts`, `.github/workflows/sync.yml`, `.gitignore`, `README.md`, `test/` |
| 3 | Discover UI — new route, component, page, initial committed data | `site/src/`, `data/suggestions.json` |

Phases are ordered by dependency (2 depends on 1; 3 consumes the file shape from 1–2) and split so
each is an independently reviewable PR. The data layer carries no external dependency and is fully
testable with a mocked `fetch`.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `site` build fails without a committed `data/suggestions.json` (static import) | High | Commit an initial file in Phase 3 |
| CI `verify` `pnpm sync --dry-run` accidentally hits RAWG | Med | Skip suggestions on `--dry-run` / missing key |
| RAWG PS5 platform code changes; poor name matches | Med | Single-source constant + integration test; `cleanTitleName` + curated overrides |
| Daily sync produces noisy `suggestions.json` diffs | Low | Stable key order + sorted arrays (repo convention) |
| RAWG usage spikes if sync cadence rises | Low | Persisted cache + 120 ms spacing keep usage far under 20k/month |

## Effort Estimate

**Overall:** Medium (3–5 days). Surface is broad (data layer + CLI + CI + UI + tests) but the RAWG
logic is a port of proven spike code.

| Phase | Estimate |
|---|---|
| Phase 1 (data layer + unit tests) | 1.5–2 days |
| Phase 2 (sync + CI + integration test) | 1 day |
| Phase 3 (Discover UI + tests) | 1–1.5 days |

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement phase by phase.
3. After implementation is merged, delete `.agents/issue-planner/38/` and close the issue.
