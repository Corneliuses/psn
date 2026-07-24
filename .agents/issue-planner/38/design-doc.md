# Design Doc — Phase 7: Game suggestions for titles we don't own (#38)

## Overview

Suggest games *neither* player owns, drawn from playtime-weighted genre profiles of the
synced libraries, using the RAWG API as the catalog source. This is the v2 "Discover"
feature the Phase 6 spike (#9) recommended. Suggestions are ancillary data committed at
`data/suggestions.json`, refreshed at sync time, and surfaced as a new **Discover** page.

## Acceptance Criteria

- [ ] **AC1** — Fetch layer (`src/suggestions/fetch.ts`): RAWG client that matches owned titles
  (PS4/PS5 only) to genres and fetches highly-rated unowned games per top shared genre,
  respecting rate limits (≥120 ms between requests; 20k req/month cap).
- [ ] **AC2** — Sync integration (`src/suggestions/sync.ts`): runs after `psn-api` sync, reads
  `data/*/latest.json`, builds genre profiles, writes `data/suggestions.json` atomically.
  `pnpm sync` includes suggestions; `pnpm sync --no-suggestions` skips them.
- [ ] **AC3** — Stats function (`src/suggestions/stats.ts`): top genres per player (by playtime
  hours), shared genres between players, per-genre suggestion counts (top 3 genres/player).
- [ ] **AC4** — No change to `PlayerSnapshot` or `schemaVersion`; sample `suggestions.json` in
  `src/fixtures/`.
- [ ] **AC5** — UI surface (`site/src/components/Suggestions.tsx` + a new **Discover** route):
  top shared genres, 5–10 suggestions/genre, each linking to `https://rawg.io/games/{rawgId}`,
  with a "Data from [RAWG](https://rawg.io)" attribution footer.
- [ ] **AC6** — Curated overrides (`data/suggestions-overrides.json`): manual JSON keyed by RAWG
  ID or title, hides misclassified games / adds edge cases, applied before the final write,
  gitignored (local-only).
- [ ] **AC7** — Unit tests (mocked RAWG, no network), integration test (sync against sample
  snapshots, verify file shape); `pnpm lint/typecheck/test/build` green for root **and** `site/`.

### Clarifications confirmed (planning round)

- **Discover surface** → **new top-level `/discover` route** + AppShell nav link (mirrors the
  existing Compare route). Shared-genre suggestions are inherently a both-players view.
- **Missing `RAWG_API_KEY`** → **skip with a warning, leave the committed `data/suggestions.json`
  untouched**. Sync never breaks for a contributor or a CI job without the key.
- **Owned-title → genre matching** → **persist a committed title→genre cache**
  (`data/suggestions-cache.json`) so each sync only fetches genres for newly-seen titles.
- **CI refresh** → **wire into the daily sync** by adding a `RAWG_API_KEY` secret to
  `.github/workflows/sync.yml`.

## Architecture & Data Model

Data flow (extends the repo's one-way rule): `data/*/latest.json` → `src/suggestions` (fetch +
stats + cache + overrides) → `data/suggestions.json` → `site/` (`data.ts` static import) → UI.
The suggestions module reads snapshots but performs its own network I/O; the existing purity rule
applies specifically to `src/stats`, so genre-profile math lives in the pure `src/suggestions/stats.ts`
while all fetch/write I/O stays in `fetch.ts`/`sync.ts`.

### Data Layer

**`data/suggestions.json`** (committed, one file, per the issue schema):

```json
{
  "by_genre": {
    "Action": [{ "name": "Game Title", "rawgId": 12345, "rating": 85, "released": "2024-01-15" }]
  },
  "shared_genres": ["Action", "RPG"],
  "metadata": {
    "generated_at": "2026-07-24T05:30:00Z",
    "rawg_base_url": "https://rawg.io",
    "attribution": "Data from RAWG.io",
    "build": "v0.1.0"
  }
}
```

(`shared_genres` — ordered top-shared list — is added so the UI need not re-derive ordering; it is
still ancillary and outside `PlayerSnapshot`.)

**`data/suggestions-cache.json`** (committed): `nameKey → { rawgId, matchedName, genres[], checkedAt }`.
Lets a sync fetch genres only for titles absent from (or stale in) the cache — steady-state RAWG
usage drops to a handful of requests.

**`data/suggestions-overrides.json`** (gitignored): `{ "hide": [rawgId | "name"], "add": { "<genre>":
[Suggestion] } }`. Loaded at sync time, applied before the atomic write.

No change to `PlayerSnapshot` or `schemaVersion` (AC4). A `sampleSuggestions()` factory is added to
`src/fixtures/sample.ts` for tests and the initial committed file.

### API / Service Layer

| Endpoint / Function | Type | Auth | Purpose |
|---|---|---|---|
| `matchOwnedTitles(library, deps)` | Internal (`fetch.ts`) | RAWG key | Resolve each cleaned owned title → `{ rawgId, genres }` via RAWG `games?search=` |
| `fetchSuggestionsForGenres(genres, ownedKeys, deps)` | Internal (`fetch.ts`) | RAWG key | RAWG `games?genres=&platforms=18,187&ordering=-metacritic`, exclude owned |
| `buildGenreProfile / topGenres / sharedGenres` | Pure (`stats.ts`) | none | Playtime-weighted profiles, top-3/player, shared set |
| `syncSuggestions(opts)` | Internal (`sync.ts`) | RAWG key | Orchestrate: read snapshots → cache → fetch → overrides → atomic write |

RAWG constants reused from the spike: platforms `18,187` (PS4, PS5), game categories
`ps4_game`/`ps5_native_game`/`ps4_ps2emu_game`, `nameKey()` + a `cleanTitleName()` helper.

### UI Component Tree

- `DiscoverPage` (`site/src/pages/DiscoverPage.tsx`) — loads `suggestionsData()` + both snapshots;
  empty state when the file is empty/unsynced.
  - `Suggestions` (`site/src/components/Suggestions.tsx`) — composes `GlassCard` + `SectionHeader`;
    one genre group per shared genre, 5–10 links each, RAWG attribution footer.
- `App.tsx` gains a `<Route path="/discover">`; `AppShell` nav + `routes.ts` gain `DISCOVER_PATH`.

## Key Decisions

### Decision 1: Discover as a new route vs. a section on an existing page

**Options considered:**
- A: New top-level `/discover` route + nav link.
- B: A section appended to `ComparePage`.
- C: Per-player section on each `PlayerPage`.

**Decision:** A — new `/discover` route.
**Rationale:** Suggestions are framed around *shared* genres (a both-players concept), so a
per-player page (C) is a poor fit; ComparePage (B) is already dense. A new route mirrors the
existing `COMPARE_PATH` pattern in `routes.ts`/`App.tsx`/`AppShell.tsx` and keeps the concern
isolated. AGENTS.md §4 requires nav to derive from config and the route structure to stay intact —
a cleanly-added route respects both.

### Decision 2: Port the spike, don't reinvent

**Decision:** Lift `cleanTitleName`, `collectLibrary`, `topSharedGenres`, and the RAWG fetch shape
from `scripts/spike-suggestions.ts` into `src/suggestions/`, dropping the IGDB path.
**Rationale:** The spike already encodes the hard-won details (media-app filtering, cross-platform
dedupe, `-metacritic` ordering, 120 ms spacing). Reusing it de-risks the port; the spike script
stays as-is (it documents #9) until cleanup.

### Decision 3: Persisted title→genre cache

**Options considered:** re-match every owned title each sync (~30–60 req) vs. commit a
`nameKey → genres` cache.
**Decision:** Commit `data/suggestions-cache.json`; fetch genres only for cache-miss titles.
**Rationale:** Libraries are stable between daily syncs, so re-matching is redundant network work.
The cache lives under `data/`, so the existing `git add data/` step in `sync.yml` commits it with
no workflow change. Keeps steady-state RAWG usage to the per-genre suggestion calls plus the
occasional new title.

### Decision 4: Graceful skip when the key is absent

**Decision:** If `RAWG_API_KEY` is unset (or `--dry-run`), log a warning and leave
`data/suggestions.json` untouched; never write fixture data to `data/`.
**Rationale:** `pnpm sync --dry-run` runs in the CI `verify` job with no RAWG key and must not hit
the network; contributors without a RAWG account must still be able to sync. Writing fixtures to
`data/` would violate the AGENTS.md rule against committing fixture data as real.

## Security & Permissions

- `RAWG_API_KEY` is a secret: lives in `.env` (gitignored) locally and as a GitHub Actions secret
  for the daily sync. Never logged, never committed — surface only the env-var *name* on a missing
  key, mirroring the `NPSSO_*` handling in `sync.ts`.
- No auth/roles in this app; the site is static and public. RAWG data is public catalog data.
- Attribution (RAWG's terms) is enforced in the UI footer (AC5).

## Error Handling

| Layer | Failure | Handling |
|---|---|---|
| `fetch.ts` | RAWG non-2xx / network error | Throw `RAWG <path> failed: HTTP <status>` (no key in message); a per-title match failure records `null` genres and continues (partial profile, never a crash) |
| `sync.ts` | Missing `RAWG_API_KEY` / `--dry-run` | Warn + skip; existing `data/suggestions.json` untouched |
| `sync.ts` | Write interrupted | Atomic write (temp file + `rename`) — never a partial `suggestions.json` |
| `sync.ts` | Malformed overrides / cache file | Warn + treat as empty; sync proceeds |
| `DiscoverPage` | Empty/absent suggestions | Styled empty state (mirrors `ComparePage` `EmptyState`) |

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Fetch | Unit | `test/suggestions-fetch.test.ts` | Injected `fetch` + zeroed delay; mocked RAWG search/genre/suggest responses; asserts owned-exclusion, genre extraction, request spacing |
| Stats | Unit | `test/suggestions-stats.test.ts` | Pure; fixture snapshots incl. empty-snapshot and tie cases (per AGENTS.md purity rule) |
| Sync | Integration | `test/suggestions-sync.test.ts` | Injected fetch + temp dir + sample snapshots; asserts `data/suggestions.json` shape, atomicity (no temp left), overrides applied, cache written |
| Component | Unit | `site/src/components/Suggestions.test.tsx` | Render, heading roles/names, one `listitem` per suggestion, RAWG link hrefs, attribution link, reduced-motion static state |
| Page | Unit | `site/src/pages/DiscoverPage.test.tsx` | Renders groups + empty state |

## Config Changes

- [ ] Schema / index changes — **none** to `PlayerSnapshot`; add `./suggestions` export to root
  `package.json` so `site/` imports the `Suggestion`/`SuggestionsFile` types from `psn/suggestions`.
- [ ] Access rule changes — none required.
- [ ] Environment variables — `RAWG_API_KEY` (new): documented in `.env.example` + README; added to
  the Sync step env in `.github/workflows/sync.yml` as `${{ secrets.RAWG_API_KEY }}` (repo secret
  must be created out-of-band).
- [ ] `.gitignore` — add `data/suggestions-overrides.json`.
- [ ] Dependency changes — **none** (Node 22 global `fetch`, per the issue).

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| `data/suggestions.json` absent at first `site` build | High (build fails — static import) | Commit an initial file (Phase 3) generated from a real sync or `sampleSuggestions()` |
| CI `verify` runs `pnpm sync --dry-run` with no RAWG key | Med (accidental network / failure) | Skip suggestions on `--dry-run` or missing key |
| RAWG PS5 platform code (`187`) renamed/dropped | Med (empty results) | Constant in one place; integration test on shape; spike flagged it as a watch item |
| Poor name matches (VR titles, bundles) | Med (bad genres) | `cleanTitleName` + curated overrides escape hatch (AC6) |
| RAWG page URL uses slug not id | Low (link resolves via redirect) | Issue schema fixes `https://rawg.io/games/{rawgId}`; optionally also store `slug` in cache for future use |
| Daily sync churns `suggestions.json` (noisy diffs) | Low | Stable key order + sorted arrays (repo's diff-friendly convention) |
| Rate limit if sync cadence rises | Low | Cache + 120 ms spacing keep usage far under 20k/month; batch queuing deferred (tracked in spike) |
