# Design Doc — Phase 1: Roster foundation — add Nadia to config, data, and sync (#41)

## Overview

Make Nadia a first-class configured player. Because routes, nav, splash portal cards, accents,
and the e2e smoke suite all derive from `psn.config.json`, most of the site lights up from the
config entry alone. The real work is the plumbing that is still hardcoded to `dad`/`braidan`:
the site's snapshot imports (`site/src/data.ts:8-15`), the fixture library
(`src/fixtures/sample.ts:74-77`), and the sync workflow's env block.

This is the foundational issue of milestone #48 — it blocks #43 (compare routing), #45 (family
language), #46 (Discover), and #47 (docs), and runs in parallel with #42.

## Acceptance Criteria

- [ ] AC1: `psn.config.json` contains a third player `{ key: "nadia", displayName: "Nadia",
      auth: { mode: "npsso", envVar: "NPSSO_NADIA" } }`.
- [ ] AC2: `src/fixtures/sample.ts` provides a Nadia raw library, so `sampleSnapshot('nadia', …)`
      and `sampleRawResponses('nadia')` resolve instead of throwing.
- [ ] AC3: `data/nadia/latest.json` exists as a committed placeholder snapshot generated via
      `sampleSnapshot()`, explicitly flagged as fixture data pending her first real sync.
- [ ] AC4: `site/src/data.ts` loads every player's `latest.json` via an eager `import.meta.glob`
      over `../../data/*/latest.json`, keyed by directory name — no per-player import statements.
- [ ] AC5: `site/src/data.test.ts` asserts that **every** configured player (from
      `psn.config.json`) resolves a snapshot whose `player.key` matches, rather than naming
      `dad`/`braidan` literally.
- [ ] AC6: `.github/workflows/sync.yml` passes `NPSSO_NADIA: ${{ secrets.NPSSO_NADIA }}` in the
      sync env block, and its header comment reflects a three-token roster.
- [ ] AC7: The splash portal-card grid accommodates a three-player roster without an orphaned
      card, driven by roster size rather than a hardcoded count of 3.
- [ ] AC8: All gates green — root (`lint`, `typecheck`, `test`, `build`), site (`lint`,
      `typecheck`, `test`, `build`), site e2e smoke (which now auto-covers `/nadia`), and
      `pnpm sync --dry-run` completing the three-player pipeline with zero credentials and
      exit code 0.
- [ ] AC9: The repo owner adds the `NPSSO_NADIA` Actions secret (manual, out-of-band — an agent
      cannot do this).

## Architecture & Data Model

### Data Layer

No schema change. `PlayerSnapshot` (`src/psn/models.ts`) is per-player and roster-agnostic;
`schemaVersion` stays at `1`. The change is purely additive:

| Path | Change |
|---|---|
| `psn.config.json` | Third entry in `players[]` |
| `src/fixtures/sample.ts` | `NADIA_PLAYED` / `NADIA_TROPHIES` arrays + `nadia` key in the `RAW` record |
| `data/nadia/latest.json` | New committed fixture snapshot (`sampleSnapshot('nadia', 'Nadia')`) |

**Nadia's fixture library** (chosen shape: overlap-rich, ~4 played titles / ~3 trophy titles,
mirroring the `dad`/`braidan` pattern at `src/fixtures/sample.ts:48-72`):

- One title shared with **both** — `Rocket League®` (`CUSA01433_00`), so three-way shared-games
  logic has fixture coverage.
- One title shared with **Braidan only** — `Astro Bot` (`PPSA13195_00`).
- One title shared with **Dad only** — `Gran Turismo 7` (`PPSA02342_00`).
- One title **unique to her** — a new `titleId`, so per-player-only paths stay exercised.

Playtimes and trophy counts must be distinct from the other two so comparison tie-breaks and
"most played" orderings remain unambiguous in tests. As with the existing fixtures, image URLs
point at `https://image.example/…` — the e2e smoke suite already tolerates that host
(`site/e2e/smoke.spec.ts:22-30`).

### Site Data Loading

`site/src/data.ts` currently hardcodes two JSON imports into a literal `snapshots` record.
Replacement:

```ts
const LATEST_FILE_RE = /\/data\/([^/]+)\/latest\.json$/;

const latestModules = import.meta.glob<{ default: PlayerSnapshot }>('../../data/*/latest.json', {
  eager: true,
});

const snapshots: Partial<Record<string, PlayerSnapshot>> = {};
for (const [path, module] of Object.entries(latestModules)) {
  const key = LATEST_FILE_RE.exec(path)?.[1];
  if (key) snapshots[key] = module.default;
}
```

The glob pattern is one directory level deeper than `data/suggestions.json` and
`data/suggestions-cache.json`, so those files are naturally excluded — no extra filtering
needed. `snapshotByKey` and `snapshotsByKey` keep their signatures and their
`undefined` / `[]` behaviour for unconfigured keys, so no caller changes.

Note the existing dated-history glob (`site/src/data.ts:37-39`) already matches
`../../data/*/*.json`, which *includes* `latest.json`; it filters those out by regex. The new
glob is deliberately separate and narrower for clarity — Vite dedupes the underlying modules,
so the double match costs nothing at build time.

### API / Service Layer

| Endpoint / Function | Type | Auth | Purpose |
|---|---|---|---|
| `loadConfig` (`src/cli/config.ts:30`) | Internal | n/a | Already validates an arbitrary player list — **no change** |
| `syncPlayer` (`src/cli/sync.ts:43`) | Internal | `NPSSO_NADIA` | Already loops the roster — **no change** |
| `syncSuggestions` (`src/suggestions/sync.ts:48`) | Internal | `RAWG_API_KEY` | Already takes `players[]` — **no change**, but see Risks |
| `snapshotByKey` / `snapshotsByKey` (`site/src/data.ts`) | Build-time | Public site | Reimplemented over a glob; same signature |

### UI Component Tree

No new components. Everything derives from `players`:

```
App.tsx  → routes.ts → playerPaths       (adds /nadia automatically)
AppShell → players.map                    (adds nav link automatically)
SplashPage
  ├── portal cards: players.map           (adds card automatically — grid needs a column bump)
  └── VS banner: players[0] / players[1]  (Nadia not shown — deferred to #43)
ComparePage → players[0] / players[1]     (Nadia not compared — deferred to #43)
accentForKey → config order               (Nadia is index 2 → ✕ cross, no code change)
```

The only site-UI change in scope is the portal-card grid column count.

## Key Decisions

### Decision 1: Nadia's fixture library shape

**Options considered:**
- A: Overlap-rich, ~4 titles (one shared with both, one with each, one unique).
- B: Minimal 2 disjoint titles — smallest thing that satisfies the e2e metric assertion.
- C: Empty snapshot — honest about her having no real data yet.

**Decision:** A — overlap-rich, ~4 titles.
**Rationale:** `sampleSnapshot('nadia', …)` throws today (`src/fixtures/sample.ts:81`), so a
fixture is required regardless — this is not optional work the issue's task list can skip. Given
that, the fixture should be useful: the same fixtures back `pnpm sync --dry-run`, the root
`test/stats.test.ts` suite, and every site page test. Overlap is what makes three-way
shared-games, compare, and shared-genre logic testable in #42/#43/#46 without another fixture
change. Option C is actively harmful: the e2e smoke asserts a visible
`\d+h \d+m|\d+ trophies` metric on every player route (`site/e2e/smoke.spec.ts:70-71`), so an
empty snapshot would fail `/nadia` and force a smoke-suite change.

### Decision 2: Glob-based snapshot loading vs. a third import statement

**Options considered:**
- A: Add `import nadiaSnapshot from '../../data/nadia/latest.json'` (2-line change).
- B: Replace both imports with an eager `import.meta.glob` keyed by directory name.

**Decision:** B — the glob.
**Rationale:** Per the issue, and it matches the pattern already established for dated history at
`site/src/data.ts:37-39`. It also means player #4 needs zero changes here, which is the point of
a "roster foundation" issue. The cost is that `snapshots` becomes derived rather than literal, so
a typo'd config key silently yields `undefined` instead of a build error — mitigated by AC5's
test, which asserts every *configured* player resolves a snapshot and would fail loudly on a
missing or misnamed `data/<key>/latest.json`.

### Decision 3: Missing `NPSSO_NADIA` secret → red nightly runs

**Options considered:**
- A: Accept red daily-sync runs until the owner adds the secret.
- B: Change `sync.ts` so a missing token warns-and-skips instead of failing.
- C: Hold the PR until the secret is added.

**Decision:** A — accept red runs.
**Rationale:** `sync.ts` isolates per-player failures (`src/cli/sync.ts:86-89`) and the workflow's
commit step runs under `if: ${{ !cancelled() }}`, so Dad's and Braidan's snapshots still commit
every night; only the exit code goes red. That red run *is* the reminder, matching the workflow's
own stated design (`.github/workflows/sync.yml:6-9`: "we deliberately build no custom
notifications … GitHub's own workflow-failure notifications are the alert"). Option B would also
silence a genuinely expired Dad/Braidan token — turning a loud, correct alarm into a silent data
gap — and expands a roster-plumbing PR into CLI behaviour changes. Option C blocks four
downstream issues on a manual step.

### Decision 4: Splash grid, but not compare routing

**Options considered:**
- A: Defer everything two-player to #43.
- B: Defer compare logic to #43, but fix the portal-card grid now.
- C: Pull #43's pair-selection forward into this PR.

**Decision:** B.
**Rationale:** `SplashPage.tsx:61` is `sm:grid-cols-2`, so the third card lands alone on a second
row the moment Nadia is configured — a visible regression introduced *by this PR*, so this PR
should own it. The two-player VS banner (`SplashPage.tsx:89,98`) and `ComparePage.tsx:32-33` are
genuine product questions (which pair? a selector? all three?) that #43 exists to answer, and
pulling them in would make this PR much harder to review. To avoid trading one hardcoded number
for another, the grid classes are selected from a small lookup keyed on `players.length` with
full literal class strings (so Tailwind's scanner sees them), not by interpolating the count.

## Security & Permissions

- `NPSSO_NADIA` is a credential: it lives only in `.env` (gitignored) and as an Actions repo
  secret. It is never committed, logged, or embedded in an error message — `PsnAuthError`
  (`src/psn/client.ts:14`) names the env var, never the value. The workflow references it only as
  `${{ secrets.NPSSO_NADIA }}`.
- Adding the secret is a **manual owner step** and cannot be done by an agent.
- Nadia's data is the same low-sensitivity class as the existing players' (game/trophy/playtime
  only, first-name-only display name per `README.md:91`). No new data category is introduced.
- The site is fully public and static; there is no auth layer, no role model, and no data-access
  rules to update. Adding a player adds a public `/nadia` route by design.

## Error Handling

| Layer | Failure | Behaviour |
|---|---|---|
| `loadConfig` | Malformed new player entry | Throws with the offending key named (`src/cli/config.ts:36-44`) |
| `sync.ts` | `NPSSO_NADIA` unset | Per-player `✗ Nadia: Missing NPSSO_NADIA…`, other players still sync, process exits 1 |
| `sync.ts` | PSN auth rejects the token | `PsnAuthError` naming the env var (never the value), same isolation |
| `site/src/data.ts` | No `data/<key>/latest.json` for a configured player | `snapshotByKey` returns `undefined`; `PlayerPage` renders its existing not-synced empty state; AC5's test fails in CI first |
| `ComparePage` | Snapshot missing for player A or B | Existing styled `EmptyState` (`site/src/pages/ComparePage.tsx:41-43`) — unchanged |
| `syncSuggestions` | Any failure | Already non-fatal, logged and skipped (`src/cli/sync.ts:109-113`) |

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Fixtures | Unit | `test/map.test.ts` | Add a case asserting `sampleRawResponses('nadia')` resolves and `sampleSnapshot('nadia', 'Nadia')` produces a well-formed, sorted snapshot |
| Site data loader | Unit | `site/src/data.test.ts` | Rewrite over `psnConfig.players` — every configured player resolves a snapshot with a matching `player.key`; unconfigured key still `undefined`; history still ordered |
| Site config | Unit | `site/src/config/players.test.ts` | Already config-derived; add `playerByKey('nadia')` alongside the existing two |
| Site accents | Unit | `site/src/config/accents.test.ts` | Already index-based; confirm Nadia (index 2) resolves ✕ `text-shape-cross` |
| Splash | Component | `site/src/pages/SplashPage.test.tsx` | Already iterates `players` (`:22-25`) — should pass unchanged; verify the grid change breaks no accessible-name assertions |
| Routes | Unit | `site/src/routes.test.tsx` | Already `players.length >= 2`; passes unchanged |
| E2E | Playwright smoke | `site/e2e/smoke.spec.ts` | Auto-covers `/nadia` from config — no edit needed; this is the real proof the glob survives a production `vite build` |
| CLI | Manual | — | `pnpm sync --dry-run` exits 0 across all three players (see the Risks table for the data-clobber caveat) |

## Config Changes

- [ ] Schema / index changes — **none required** (`schemaVersion` stays `1`).
- [ ] Access rule changes — **none required** (public static site, no auth layer).
- [ ] Environment variables — **`NPSSO_NADIA`**: new Actions repo secret (manual owner step) and a
      new line in `.env.example` for local sync. `.env.example` could not be read during planning
      (permission-blocked), so confirm its exact format at implementation time.
- [ ] Dependency changes — **none required**.

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| `sampleSnapshot('nadia')` throws — the issue's task list assumes it works | **High** — blocks both the fixture snapshot and `--dry-run` verification | Add `NADIA_PLAYED`/`NADIA_TROPHIES` to `src/fixtures/sample.ts` **first**; everything else depends on it |
| `pnpm sync --dry-run` calls `writeSnapshot` for real (`src/cli/sync.ts:81`), overwriting `data/dad/latest.json` and `data/braidan/latest.json` — which now hold **genuine** synced data — with fixture data | **High** — silent corruption of the committed trend dataset if the result is committed | Run the dry-run verification **last**, then immediately `git checkout -- data/dad data/braidan` and confirm `git status --porcelain data/` shows only the intended `data/nadia/latest.json`. Pre-existing hazard, not introduced here — file a follow-up issue to make `--dry-run` write to a temp dir |
| `sharedGenres` (`src/suggestions/stats.ts:107-119`) keeps only genres **every** player has time in; a third player narrows the intersection | Medium — `data/suggestions.json` may shrink or empty on the next real sync, thinning the Discover page | Accepted for Phase 1. File a follow-up issue to revisit the all-players rule (e.g. ≥2 players, or roster-size weighting) and link it from #46 |
| Daily sync goes red every night until `NPSSO_NADIA` is set | Medium — alert noise | Accepted per Decision 3. Dad/Braidan data still commits. Call the manual step out prominently in the PR body |
| The `FIXTURE DATA` comment (`site/src/data.ts:4-7`) and `AGENTS.md:163` still claim `data/dad` and `data/braidan` are fixtures — they are now real synced data (dated files since 2026-07-19) | Low, but actively misleading in directly-touched code | Rewrite both to reference **only** `data/nadia/latest.json`, and state it is replaced on her first real sync |
| Splash portal grid orphans the third card | Low (cosmetic) | Roster-size-driven column lookup (Decision 4) |
| Nadia invisible on `/compare` and in the splash VS banner | Low (known, intended) | Explicitly deferred to #43; called out in the PR body so it isn't read as an oversight |
| Glob silently yields `undefined` for a typo'd config key | Low | AC5's config-driven test fails loudly in CI |
| Fixture image URLs (`image.example`) 404 in the browser on `/nadia` | Low | Already allowlisted by host in `site/e2e/smoke.spec.ts:22-30`; resolves on her first real sync |
