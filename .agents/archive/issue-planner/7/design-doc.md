# Design Doc — Phase 4: Analytics (#7)

## Overview

Add four v1 analytics views over the committed snapshot history: playtime trends
over time, trophy-earning pace, a per-player completion scoreboard, and an
expanded shared-games deep dive. Trends and pace need multiple dated snapshots
and will render sparse (often a single point) until auto-sync (#8) accumulates
history — this is an expected, non-blocking state the code must handle gracefully.

## Acceptance Criteria

- [ ] AC1 — `readAllSnapshots(baseDir, playerKey)` returns every dated snapshot for a player, oldest → newest (empty array for an unknown player).
- [ ] AC2 — `playtimeTrend(snapshots)` returns per-snapshot total playtime, oldest → newest, in a line-chart-ready shape; does not crash on a single snapshot or an empty array.
- [ ] AC3 — `trophyPace(snapshots)` returns trophies earned between each consecutive snapshot pair (delta by tier); returns `[]` for fewer than two snapshots.
- [ ] AC4 — `completionScoreboard(snapshot)` returns the near-platinum list (`progress >= 90 && !hasPlatinum`), an untouched-backlog count (played titles with no matching trophy title or `earnedTotal === 0`), and the average `progress` across trophy titles.
- [ ] AC5 — `sharedGamesDeepDive(a, b)` expands the shared-games comparison with a playtime gap, a trophy gap, and a "who played it more recently" per shared game.
- [ ] AC6 — Every new pure function has fixture-based unit tests, explicitly including the single-snapshot and empty cases.
- [ ] AC7 — The four views render in `site/`, split across existing pages: playtime trend, trophy pace, and completion scoreboard on each `PlayerPage`; the shared-games deep dive on `ComparePage`. Each reuses the established component patterns and satisfies the AGENTS.md ship checklist (semantics, contrast, keyboard, reduced motion, gate green).
- [ ] AC8 — Root and `site/` lint, typecheck, test, and build all pass.

## Architecture & Data Model

### Data Layer

Two readers of the same on-disk history, one per runtime:

- **Node (library):** `readAllSnapshots(baseDir, playerKey): PlayerSnapshot[]` in
  `src/snapshot/store.ts`. Uses the existing `listSnapshotDates` to enumerate
  `data/<player>/<YYYY-MM-DD>.json` (oldest → newest) and `readFileSync` +
  `JSON.parse` each. `latest.json` is intentionally excluded — it duplicates the
  newest dated file, so counting it would double the last point.
- **Site (static Vite build):** `snapshotsByKey(key): PlayerSnapshot[]` added to
  `site/src/data.ts`, backed by `import.meta.glob('../../data/*/*.json', { eager: true })`.
  Dated files are grouped by their parent-directory player key and sorted oldest →
  newest. When a player has **no** dated files (the current state — only
  `latest.json` is committed), it falls back to `[latest.json]` so trends render a
  single point instead of nothing. The existing `snapshotByKey` (single latest
  snapshot) is unchanged and still powers the single-snapshot views.

No new snapshot shape and no `schemaVersion` bump — all functions read existing
`PlayerSnapshot` fields.

### API / Service Layer

All new stat functions are pure (snapshot(s) in, plain data out, no I/O), matching
`recent.ts` / `mostPlayed.ts` / `trophies.ts`.

| Function | Module | Signature | Purpose |
|---|---|---|---|
| `readAllSnapshots` | `src/snapshot/store.ts` | `(baseDir, playerKey) => PlayerSnapshot[]` | Node-side full-history reader |
| `playtimeTrend` | `src/stats/trends.ts` | `(snapshots) => PlaytimePoint[]` | Total playtime per snapshot over time |
| `trophyPace` | `src/stats/trends.ts` | `(snapshots) => TrophyPaceInterval[]` | Trophy deltas by tier between consecutive snapshots |
| `completionScoreboard` | `src/stats/completion.ts` | `(snapshot) => CompletionScoreboard` | Near-platinum list, untouched backlog, average progress |
| `sharedGamesDeepDive` | `src/stats/compare.ts` | `(a, b) => SharedGameDeepDive[]` | Shared games with playtime/trophy gaps + recency |
| `nameKey` | `src/stats/names.ts` | `(name) => string` | Extracted title-name normalizer, shared by compare + completion |

New/derived types:

```ts
// src/stats/trends.ts
interface PlaytimePoint { capturedAt: string; playtimeMinutes: number; }
interface TrophyPaceInterval { from: string; to: string; earned: TrophyCounts; total: number; }

// src/stats/completion.ts
interface CompletionScoreboard {
  nearPlatinum: TrophyTitleStats[]; // progress >= 90 && !hasPlatinum, progress desc
  untouchedBacklog: number;
  averageProgress: number;          // mean progress across trophyTitles, 0 when none
}

// src/stats/compare.ts (additive — existing SharedGame / comparePlayers unchanged)
type Leader = 'a' | 'b' | 'tie';
interface SharedGameSide { playtimeMinutes: number; trophiesEarned: number; lastPlayed: string; }
interface SharedGameDeepDive {
  name: string;
  a: SharedGameSide; b: SharedGameSide;
  playtimeGap: number;   // abs(a - b) minutes
  trophyGap: number;     // abs(a - b) trophies
  playtimeLeader: Leader;
  trophyLeader: Leader;
  recentlyPlayedBy: Leader; // by lastPlayed
}
```

### UI Component Tree (split across existing pages)

```
PlayerPage  (adds three sections, fed by snapshotsByKey(key) for history)
├── Playtime trend      → <TrendChart>       (NEW primitive; accessible SVG line chart)
├── Trophy pace         → <TrophyPaceList>   (NEW primitive; interval rows w/ per-tier TrophyBadges)
└── Completion          → 2× <StatTile> (backlog, avg progress) + <GameSection heading="Near platinum">
                                              (REUSE — near-platinum titles carry iconUrl)

ComparePage
└── Shared-games deep   → <SharedGamesDeepDive> (NEW; replaces <SharedGamesList>)
```

## Key Decisions

### Decision 1: Two history readers (Node fs vs. Vite glob), not one

**Options considered:**
- Option A: One `readAllSnapshots` in `src/snapshot/store.ts`, called by both.
- Option B: `readAllSnapshots` (Node fs) for the library; a separate build-time
  `import.meta.glob` reader in `site/src/data.ts` for the static site.

**Decision:** Option B.
**Rationale:** The site is a static Vite build with no filesystem at runtime — it
already imports snapshots as JSON modules at build time (`data.ts`). It cannot call
`readAllSnapshots`, which uses `node:fs`. The Architecture Rule "`site/` reads
`data/*/latest.json` and `src/stats` only" is honoured: the site reads `data/**`
JSON and pure stats, never `src/psn` or `src/snapshot`. The issue explicitly scopes
"one new store helper" (`readAllSnapshots`) plus site work, matching this split.

### Decision 2: `latest.json` excluded from history; fall back to it only when no dated files exist

**Decision:** Both readers enumerate dated `YYYY-MM-DD.json` files and skip
`latest.json`; the site reader uses `[latest.json]` **only** when a player has zero
dated files.
**Rationale:** `writeSnapshot` mirrors the newest dated file into `latest.json`, so
including both would duplicate the final trend point. Today only `latest.json` is
committed, so the fallback is what makes trends show a (single-point) line now
rather than an empty chart — and it disappears cleanly once #8 commits dated files.

### Decision 3: Additive `sharedGamesDeepDive`, not a change to `SharedGame`

**Decision:** Add a new `sharedGamesDeepDive` export and `SharedGameDeepDive` type;
leave `comparePlayers`, `Comparison`, and `SharedGame` untouched.
**Rationale:** `comparePlayers().sharedGames` and the `SharedGame` shape are consumed
by `MetricScoreboard` and covered by `stats.test.ts`. An additive export delivers the
deep dive without a breaking change to the compare data contract or its tests.

### Decision 4: Extract `nameKey` into `src/stats/names.ts`

**Decision:** Move the private `nameKey` normalizer out of `compare.ts` into
`src/stats/names.ts`; `compare.ts` and `completion.ts` both import it.
**Rationale:** The completion scoreboard's untouched-backlog check and the deep dive
both need the same "Rocket League® (PS4) matches Rocket League (PS5)" name matching
`compare.ts` already implements. One shared normalizer keeps title-matching identical
across stats (per the AGENTS.md reuse rule) instead of duplicating the regex.

### Decision 5: Replace `SharedGamesList` with `SharedGamesDeepDive` on ComparePage

**Options considered:**
- Option A: Keep `SharedGamesList` and add a second deep-dive section below it.
- Option B: Replace `SharedGamesList` with a new `SharedGamesDeepDive` component.

**Decision:** Option B — new `SharedGamesDeepDive` component, delete the superseded
`SharedGamesList` component and its test, update `ComparePage` and `ComparePage.test`.
**Rationale:** The deep dive is a strict superset of the basic list (same rows plus
gaps and recency). Keeping both would show shared games twice and leave dead code,
which AGENTS.md's clean-code stance discourages.

### Decision 6: Two new chart-ish primitives, reuse elsewhere

**Decision:** Add `TrendChart` (accessible SVG line chart) and `TrophyPaceList`
(interval rows using existing `TrophyBadge` for per-tier deltas). Render the
completion scoreboard by reusing `StatTile` (backlog, avg progress) and `GameSection`
(near-platinum list) — no new primitive.
**Rationale:** No charting library is in the stack and AGENTS.md forbids inventing
one-off primitives when the kit suffices. The trend line and the tiered pace bars are
genuinely new marks that can't be composed from the kit, so each is a real primitive
shipping with its own component test; completion is fully expressible with the kit.

## Security & Permissions

No auth surface. The site is a public static build reading committed snapshots; no
tokens, roles, or access controls are involved. `data/` snapshots contain only
already-committed public PSN stats.

## Error Handling

| Layer | Behaviour |
|---|---|
| `readAllSnapshots` | Unknown player → `[]` (via `listSnapshotDates`'s existing try/catch). |
| `site/src/data.ts` | Player with no dated files → `[latest.json]`; unconfigured key → `[]`. |
| `playtimeTrend` / `trophyPace` | Empty → `[]`; single snapshot → one point / `[]` respectively (no consecutive pair). |
| `completionScoreboard` | No trophy titles → `averageProgress` 0, empty near-platinum, backlog counted from played titles. |
| `sharedGamesDeepDive` | No overlap (incl. empty opponent) → `[]`; missing per-side title defaults to 0 playtime/trophies. |
| UI | `TrendChart` with < 2 points shows a static "Not enough history yet" state; every section renders complete and static under reduced motion. |

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Store | Unit | `test/store.test.ts` | `readAllSnapshots` oldest→newest, unknown player `[]`, excludes `latest.json`, multi-day history. |
| Stats — trends | Unit | `test/stats.test.ts` | `playtimeTrend` (multi/single/empty); `trophyPace` deltas by tier, `[]` for < 2 snapshots. |
| Stats — completion | Unit | `test/stats.test.ts` | Near-platinum threshold, untouched backlog (no-match + `earnedTotal===0`), average progress incl. empty. |
| Stats — deep dive | Unit | `test/stats.test.ts` | Gaps, leaders, recency, tie handling, empty opponent. |
| Component | Unit | `site/src/components/TrendChart.test.tsx` | Renders, accessible name, single-point + empty states, jsdom-safe final state. |
| Component | Unit | `site/src/components/TrophyPaceList.test.tsx` | Renders interval rows + tier badges, empty state. |
| Component | Unit | `site/src/components/SharedGamesDeepDive.test.tsx` | Rows, gaps, recency label, empty state. |
| Page | Unit | `site/src/pages/PlayerPage.test.tsx`, `ComparePage.test.tsx` | New sections present; updated for the `SharedGamesList` → deep-dive swap. |
| Data | Unit | `site/src/data.test.ts` | `snapshotsByKey` returns a non-empty ordered array (latest fallback today). |

## Config Changes

- [ ] Schema / index changes — none required (no `PlayerSnapshot` shape change).
- [ ] Access rule changes — none required.
- [ ] Environment variables — none required.
- [ ] Dependency changes — none required (SVG line chart hand-rolled; no chart lib).

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| Only `latest.json` on disk (today) | Med | Site fallback renders a single-point trend; `trophyPace` returns `[]`; UI shows a static "not enough history yet" state — all covered by single-snapshot tests. |
| `latest.json` double-counted in history | Med | Both readers enumerate dated files only; unit test asserts `latest.json` is excluded. |
| Title-name mismatch across platforms (PS4 vs PS5) | Med | Shared `nameKey` normalizer reused for backlog matching and the deep dive. |
| Negative trophy delta from a snapshot anomaly | Low | `trophyPace` clamps per-tier deltas at 0 (trophies are monotonic; guards against removed titles). |
| Breaking the compare data contract | Med | Deep dive is additive; `comparePlayers`/`SharedGame` untouched, existing tests stay green. |
| Reduced-motion / jsdom rendering of new charts | Med | `TrendChart`/`TrophyPaceList` resolve to a complete static state (no timers); component tests assert final state. |
