# Task Doc — Phase 2: Individual player stats page (#5)

## Prerequisites

- [x] #4 (site scaffold + routing) merged — `site/` exists with `PlayerPage` stub, routes,
      `snapshotByKey`, and committed fixture snapshots (`data/*/latest.json`). Confirmed present.

## Phase 1: Player stats page (single phase — cohesive frontend feature)

Ordered so each step compiles on top of the last.

### 1. Test-fixture enabler

- [ ] Add `export { sampleSnapshot } from './fixtures/sample.js';` to `src/index.ts` so `site`
      tests can import a realistic fixture snapshot from the `psn` package (Decision 4).

### 2. Presentation helpers

- [ ] Create `site/src/format.ts` — `formatDate(iso: string): string` using
      `Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })`.

### 3. Presentational component

- [ ] Create `site/src/components/GameSection.tsx`:
  - `interface GameEntry { id: string; iconUrl: string; name: string; metric: string }`
  - `interface GameSectionProps { heading: string; games: GameEntry[]; emptyLabel?: string }`
  - Renders `<section>` → `<h2>{heading}</h2>`; if `games` is empty, a `<p>` with
    `emptyLabel ?? 'No games yet'`; else a `<ul>` of rows, each with
    `<img src={iconUrl} alt={name} />`, the name, and the `metric` text.
- [ ] Write `site/src/components/GameSection.test.tsx`:
  - Renders one entry: asserts image `alt`, name text, and metric text are present.
  - Renders empty list: asserts the empty message appears and no list items exist.

### 4. Page wiring

- [ ] Rewrite `site/src/pages/PlayerPage.tsx`:
  - Keep the unknown-key "Player not found" branch.
  - Fetch `snapshotByKey(playerKey)`; if `undefined`, render the player heading + empty-state
    message ("No stats synced yet.").
  - Build four `GameEntry[]` view-models from the snapshot:
    - Recent → `recentGames(snapshot)`, metric = `Last played ${formatDate(t.lastPlayed)}`, id = `titleId`, icon = `imageUrl`.
    - Most played → `mostPlayedGames(snapshot)`, metric = `formatMinutes(t.playDurationMinutes)`, id = `titleId`, icon = `imageUrl`.
    - Most trophies → `gamesWithMostTrophies(snapshot)`, metric = `${t.earnedTotal} trophies`, id = `npCommunicationId`, icon = `iconUrl`.
    - Platinum → `platinumGames(snapshot)` (no limit → all), metric = `Platinum · ${t.earnedTotal} trophies · ${formatDate(t.lastTrophyAt)}`, id = `npCommunicationId`, icon = `iconUrl`.
  - Import `recentGames, mostPlayedGames, gamesWithMostTrophies, platinumGames, formatMinutes` from `'psn'`.
  - Render four `<GameSection>`s under `<h1>{player.displayName}'s stats</h1>`.

### 5. Page tests

- [ ] Rewrite `site/src/pages/PlayerPage.test.tsx`:
  - With `sampleSnapshot('dad', 'Dad')` injected via the real committed data (or by asserting the
    default `dad`/`braidan` keys render): assert the four section headings appear, and that
    representative metric strings render (a `formatMinutes` duration, an "N trophies" count, a date).
  - Keep the unknown-key not-found assertion.
  - Add an empty-snapshot case: render for a key whose snapshot is empty (construct an inline
    empty `PlayerSnapshot`, or assert the empty-state message path) and assert no crash + empty message.

> Note: `PlayerPage` takes `playerKey` and reads `snapshotByKey` internally. If a test needs a
> specific snapshot, prefer testing against the real committed `dad`/`braidan` data (deterministic
> fixtures) and reserve `sampleSnapshot`/inline empty snapshots for `GameSection` and empty-state
> coverage. Decide the cleanest seam during implementation; do not add production-only test hooks.

## Pre-Commit Gate

Run from repo root (per `AGENTS.md` → `## Commands`). Both packages must be green; the site
changes are what matter here, but confirm the root export change didn't break anything:

- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm --filter site typecheck` ✅
- [ ] `pnpm --filter site test` ✅
- [ ] `pnpm --filter site build` ✅
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (root — validates the `src/index.ts` export) ✅

## Files Modified / Created

| File | Change |
|---|---|
| `src/index.ts` | Re-export `sampleSnapshot` (test-fixture enabler). |
| `site/src/format.ts` | **New.** `formatDate` UTC-pinned date helper. |
| `site/src/components/GameSection.tsx` | **New.** Presentational section + `GameEntry` view-model type. |
| `site/src/components/GameSection.test.tsx` | **New.** Section rendering + empty-list tests. |
| `site/src/pages/PlayerPage.tsx` | Rewrite stub → four real stat sections + empty state. |
| `site/src/pages/PlayerPage.test.tsx` | Rewrite stub tests → sections, metrics, not-found, empty snapshot. |
