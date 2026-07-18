# Task Doc — Phase 4: Analytics (#7)

## Prerequisites

- [ ] #4 (site scaffold + routing) landed — already merged; `PlayerPage`/`ComparePage` exist.
- [ ] No dependency on #8; trends render sparse until auto-sync accumulates dated snapshots.

## Phase 1: Data & Stats (pure library + Node reader)

- [ ] `src/snapshot/store.ts`: add `readAllSnapshots(baseDir, playerKey): PlayerSnapshot[]` — map `listSnapshotDates(baseDir, playerKey)` to `readFileSync`/`JSON.parse` of each `data/<player>/<date>.json`, oldest → newest; excludes `latest.json`.
- [ ] `src/stats/names.ts`: create and export `nameKey(name: string): string` (move the private normalizer out of `compare.ts`).
- [ ] `src/stats/compare.ts`: import `nameKey` from `./names.js` (delete the local copy); add `sharedGamesDeepDive(a, b)` + `SharedGameDeepDive`/`SharedGameSide` types (playtime gap, trophy gap, per-metric leaders, `recentlyPlayedBy` via `lastPlayed`). Leave `comparePlayers`/`Comparison`/`SharedGame` unchanged.
- [ ] `src/stats/trends.ts`: add `playtimeTrend(snapshots): PlaytimePoint[]` (total playtime per snapshot, oldest → newest) and `trophyPace(snapshots): TrophyPaceInterval[]` (per-tier deltas between consecutive snapshots via `playerTotals`, clamped ≥ 0, `[]` for < 2 snapshots) + their types.
- [ ] `src/stats/completion.ts`: add `completionScoreboard(snapshot): CompletionScoreboard` — near-platinum (`progress >= 90 && !hasPlatinum`, progress desc), untouched-backlog count (played title with no `nameKey`-matching trophy title or `earnedTotal === 0`), average `progress` (0 when no trophy titles).
- [ ] `src/stats/index.ts`: export `playtimeTrend`, `trophyPace`, `completionScoreboard`, `sharedGamesDeepDive` and their types.
- [ ] `src/index.ts`: re-export `readAllSnapshots` alongside the existing store exports.
- [ ] `test/store.test.ts`: `readAllSnapshots` returns dated snapshots oldest → newest across multiple days, `[]` for unknown player, and excludes `latest.json`.
- [ ] `test/stats.test.ts`: add suites for `playtimeTrend` (multi/single/empty), `trophyPace` (deltas by tier, `[]` for < 2), `completionScoreboard` (threshold, backlog no-match + `earnedTotal===0`, average incl. empty), `sharedGamesDeepDive` (gaps, leaders, recency, ties, empty opponent).

## Phase 2: Site UI (components + page wiring)

- [ ] `site/src/data.ts`: add `snapshotsByKey(key): PlayerSnapshot[]` via `import.meta.glob('../../data/*/*.json', { eager: true })` — group dated files by player key, oldest → newest, fall back to `[latest.json]` when a player has no dated files. Keep `snapshotByKey` unchanged.
- [ ] `site/src/components/TrendChart.tsx` (+ `TrendChart.test.tsx`): accessible SVG line chart from `PlaytimePoint[]`; `aria-label`/role, single-point + empty "not enough history yet" states, complete static state under reduced motion / jsdom.
- [ ] `site/src/components/TrophyPaceList.tsx` (+ `TrophyPaceList.test.tsx`): interval rows (`from → to`) with per-tier deltas as `TrophyBadge`s on `GlassCard`/`SectionHeader`; empty state.
- [ ] `site/src/components/SharedGamesDeepDive.tsx` (+ `SharedGamesDeepDive.test.tsx`): shared-game rows with playtime gap, trophy gap, and recency winner; reuses `GlassCard`/`SectionHeader`; empty state.
- [ ] `site/src/pages/PlayerPage.tsx`: add Playtime trend (`TrendChart` from `playtimeTrend(snapshotsByKey(key))`), Trophy pace (`TrophyPaceList` from `trophyPace(...)`), and Completion (`StatTile`×2 + `GameSection` "Near platinum") sections.
- [ ] `site/src/pages/ComparePage.tsx`: replace `SharedGamesList` with `SharedGamesDeepDive` fed by `sharedGamesDeepDive(snapshotA, snapshotB)`.
- [ ] Delete `site/src/components/SharedGamesList.tsx` and `site/src/components/SharedGamesList.test.tsx` (superseded).
- [ ] Update `site/src/pages/PlayerPage.test.tsx`, `site/src/pages/ComparePage.test.tsx`, and `site/src/data.test.ts` for the new sections, the component swap, and `snapshotsByKey`.

## Pre-Commit Gate

Per AGENTS.md `## Commands`, run for **both** the root package and `site/` and confirm green:

- [ ] `pnpm lint` and `pnpm --filter site lint` ✅
- [ ] `pnpm typecheck` and `pnpm --filter site typecheck` ✅
- [ ] `pnpm test` and `pnpm --filter site test` ✅
- [ ] `pnpm build` and `pnpm --filter site build` ✅

## Files Modified / Created

| File | Change |
|---|---|
| `src/snapshot/store.ts` | Add `readAllSnapshots`. |
| `src/stats/names.ts` | New — extracted `nameKey` normalizer. |
| `src/stats/trends.ts` | New — `playtimeTrend`, `trophyPace` + types. |
| `src/stats/completion.ts` | New — `completionScoreboard` + type. |
| `src/stats/compare.ts` | Import `nameKey`; add `sharedGamesDeepDive` + types. |
| `src/stats/index.ts` | Export new stats functions/types. |
| `src/index.ts` | Re-export `readAllSnapshots`. |
| `test/store.test.ts` | `readAllSnapshots` tests. |
| `test/stats.test.ts` | Trends / completion / deep-dive tests. |
| `site/src/data.ts` | Add `snapshotsByKey` (build-time glob). |
| `site/src/components/TrendChart.tsx` (+ test) | New line-chart primitive. |
| `site/src/components/TrophyPaceList.tsx` (+ test) | New pace-interval primitive. |
| `site/src/components/SharedGamesDeepDive.tsx` (+ test) | New deep-dive list. |
| `site/src/components/SharedGamesList.tsx` (+ test) | Deleted — superseded. |
| `site/src/pages/PlayerPage.tsx` (+ test) | Trend / pace / completion sections. |
| `site/src/pages/ComparePage.tsx` (+ test) | Swap to `SharedGamesDeepDive`. |
| `site/src/data.test.ts` | `snapshotsByKey` coverage. |
