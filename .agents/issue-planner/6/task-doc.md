# Task Doc — Phase 3: Head-to-head comparison page (#6)

## Prerequisites

- [x] #4 (site scaffold + routing) merged — `site/` exists with the `ComparePage` stub, the
      `/compare` route (`App.tsx` + `routes.ts` `COMPARE_PATH`), `snapshotByKey`, and committed
      fixture snapshots (`data/*/latest.json`). Confirmed present.
- [x] `sampleSnapshot` re-exported from `psn` (`src/index.ts`) — added in #5. Confirmed present.
- No dependency on #5 (player page) or #7 (analytics); this phase can land independently.

## Phase 1: Comparison page (single phase — cohesive frontend feature)

Ordered so each step compiles on top of the last.

### 1. Scoreboard component

- [ ] Create `site/src/components/Scoreboard.tsx`:
  - Props: `{ players: Comparison['players']; metrics: MetricComparison[] }` (import types from `'psn'`).
  - Renders a `<table>`: header row `Metric | {players.a.displayName} | {players.b.displayName} | Winner`.
  - One `<tr>` per metric: `metric.label`, then the two values, then a winner cell.
  - Value formatting helper: `metric.metric === 'playtimeMinutes' ? formatMinutes(v) : String(v)`
    (import `formatMinutes` from `'psn/duration'`).
  - Winner cell: `winner === 'a' → players.a.displayName`, `'b' → players.b.displayName`,
    `'tie' → 'Tie'`. Set `data-winner={metric.winner}` on the row (or winner cell) for a future
    styling hook; no CSS added now (Decision 2).
- [ ] Write `site/src/components/Scoreboard.test.tsx`:
  - Hand-build a small `metrics` array + `players` (or slice a real `comparePlayers` result).
  - Assert the winner cell names the right player for an `'a'` win and a `'b'` win.
  - Assert a `'tie'` metric renders neutral "Tie" text and does not name either player.
  - Assert the `playtimeMinutes` row renders a `formatMinutes` string (e.g. contains `h `), not raw minutes.

### 2. SharedGames component

- [ ] Create `site/src/components/SharedGames.tsx`:
  - Props: `{ players: Comparison['players']; games: SharedGame[] }`.
  - If `games` is empty, render a `<p>` "No games in common yet."
  - Else a `<table>`: header `Game | {a.displayName} time | {a.displayName} trophies |
    {b.displayName} time | {b.displayName} trophies`; one `<tr>` per game **in the given order**
    (do not sort), keyed by `game.name`, with `formatMinutes` on both playtime cells and the raw
    `trophiesEarned` counts.
- [ ] Write `site/src/components/SharedGames.test.tsx`:
  - Renders rows in the given order (assert first row name matches the first array element).
  - Playtime cells are humanized (`formatMinutes`).
  - Empty `games` → the empty message, and no table rows.

### 3. Page wiring

- [ ] Rewrite `site/src/pages/ComparePage.tsx`:
  - Import `players` from `../config/players`, `snapshotByKey` from `../data`,
    `comparePlayers` from `'psn/stats'`, and `Scoreboard` / `SharedGames`.
  - Pick `const [a, b] = players;`. Fetch `snapshotByKey(a?.key)` / `snapshotByKey(b?.key)`.
  - If either player or snapshot is missing, render `<main><h1>Compare</h1><p>Not enough data to
    compare yet.</p></main>` (empty state; never call `comparePlayers` with a missing snapshot).
  - Otherwise `const comparison = comparePlayers(snapA, snapB);` and render:
    - `<h1>{comparison.players.a.displayName} vs {comparison.players.b.displayName}</h1>`
    - `<Scoreboard players={comparison.players} metrics={comparison.metrics} />`
    - `<SharedGames players={comparison.players} games={comparison.sharedGames} />`

### 4. Page tests

- [ ] Rewrite `site/src/pages/ComparePage.test.tsx` (mirror `PlayerPage.test.tsx`):
  - `vi.mock('../data')`; `snapshotByKeyMock.mockImplementation((k) => k === 'dad'
    ? sampleSnapshot('dad', 'Dad') : k === 'braidan' ? sampleSnapshot('braidan', 'Braidan') : undefined)`.
  - Assert the `<h1>` names both players.
  - Assert a known winner: the `playtimeMinutes` row's winner cell names **Braidan**
    (per `test/stats.test.ts`).
  - Assert the tie: the `gamesPlayed` row winner cell reads "Tie".
  - Assert shared games `Rocket League®` and `God of War Ragnarök` appear.
  - Add a case where `snapshotByKey` returns `undefined` → assert the "Not enough data" empty state
    and that no scoreboard table renders.
  - `afterEach(() => vi.resetAllMocks())`.

## Pre-Commit Gate

Discover commands from `AGENTS.md` → `## Commands`. Site changes are the whole scope; the root
package is untouched, so the site suite is the gate (a root run is a cheap sanity check):

- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm --filter site typecheck` ✅
- [ ] `pnpm --filter site test` ✅
- [ ] `pnpm --filter site build` ✅
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (root sanity — no root files changed) ✅

## Files Modified / Created

| File | Change |
|---|---|
| `site/src/components/Scoreboard.tsx` | **New.** Presentational metrics scoreboard + winner cell (`data-winner` hook). |
| `site/src/components/Scoreboard.test.tsx` | **New.** Winner-per-metric, tie-neutral, playtime-humanized tests. |
| `site/src/components/SharedGames.tsx` | **New.** Presentational shared-games table + empty state. |
| `site/src/components/SharedGames.test.tsx` | **New.** Order-preserved rows, humanized playtime, empty-list tests. |
| `site/src/pages/ComparePage.tsx` | Rewrite stub → data selection + scoreboard + shared games + empty state. |
| `site/src/pages/ComparePage.test.tsx` | **New.** dad-vs-braidan fixture tests (winner, tie, shared games, empty). |
