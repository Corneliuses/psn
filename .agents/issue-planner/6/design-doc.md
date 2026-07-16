# Design Doc — Phase 3: Head-to-head comparison page (#6)

## Overview

Turn the placeholder `ComparePage` (a "Coming soon" stub shipped in #4) into the real `/compare`
page rendering the full head-to-head between Dad and Braidan: a per-metric scoreboard with winner
indicators, and a shared-games breakdown. Frontend-only work — `comparePlayers` already returns a
UI-ready `Comparison`, so no data-layer changes are needed.

## Acceptance Criteria

- [ ] `ComparePage` reads both players' snapshots via `snapshotByKey` and calls
      `comparePlayers(dadSnapshot, braidanSnapshot)`.
- [ ] `comparison.metrics` rendered as a table/scoreboard: metric label, both players' values, and
      a visual winner indicator derived from `metric.winner`.
- [ ] `comparison.sharedGames` rendered: game name, each player's playtime and trophies earned,
      in the order returned (combined playtime, highest first — no client-side re-sorting).
- [ ] Tie case (`winner === 'tie'`) rendered with neutral styling — not defaulting to either player.
- [ ] Zero shared games handled gracefully with a friendly empty state.
- [ ] Missing-snapshot case handled gracefully (a configured player with no synced data yet).
- [ ] Component tests against fixture snapshots (`sampleSnapshot('dad', …)` vs
      `sampleSnapshot('braidan', …)`), covering the scoreboard, a tie, shared games, and empties.
- [ ] `site` lint, typecheck, test, and build all pass.

## Architecture & Data Model

### Data Layer

No new data structures. The page consumes existing shapes from the `psn` workspace package:

- `Comparison` (`src/stats/compare.ts`), with nested `players`, `totals`, `metrics`, `sharedGames`.
- `MetricComparison` — `{ metric, label, a, b, winner: 'a' | 'b' | 'tie' }`.
- `SharedGame` — `{ name, a: { playtimeMinutes, trophiesEarned }, b: {…} }`.
- `PlayerIdentity` (via `comparison.players.a/b`) — supplies each column's `displayName`.

`snapshotByKey(key)` already returns `PlayerSnapshot | undefined` from committed
`data/<player>/latest.json` — no change needed there.

### API / Service Layer

Pure functions consumed from the `psn` package (already re-exported; no change required):

| Function / Type | Type | Auth | Purpose |
|---|---|---|---|
| `comparePlayers(a, b)` | Pure (internal) | n/a | Returns a UI-ready `Comparison` |
| `formatMinutes(minutes)` | Pure (internal) | n/a | `13737` → `"228h 57m"` (playtime rows) |
| `Comparison`, `MetricComparison`, `SharedGame` | Types | n/a | Imported from `'psn'` for props/view-models |

### UI Component Tree

```
ComparePage (site/src/pages/ComparePage.tsx)
├─ empty state          (fewer than two snapshots available → "Not enough data to compare yet.")
└─ comparison view
   ├─ <h1> "Dad vs Braidan"            (names from comparison.players.a/b.displayName)
   ├─ Scoreboard (site/src/components/Scoreboard.tsx)
   │  └─ <table>: one row per metric — label | A value | B value | winner cell
   │            winner marked via data-winner + visible/accessible text; 'tie' → neutral
   └─ SharedGames (site/src/components/SharedGames.tsx)
      └─ <table> of shared games (name, A playtime+trophies, B playtime+trophies)
         └─ empty-list message when comparison.sharedGames is empty
```

`ComparePage` picks the two players from `players` config (`players[0]` = side **a**,
`players[1]` = side **b**), fetches each snapshot, and — when both exist — passes the computed
`Comparison` down to two small presentational components. This mirrors the #5 pattern (page builds
view-models; lean presentational components render them and are unit-tested in isolation).

## Key Decisions

### Decision 1: Derive the two players from `players` config, not hardcoded `dad`/`braidan`

**Options considered:**
- Option A: Hardcode `snapshotByKey('dad')` / `snapshotByKey('braidan')`.
- Option B: Take `players[0]` and `players[1]` from `config/players.ts` as sides a and b.

**Decision:** Option B.
**Rationale:** `AGENTS.md` and `config/players.ts` are explicit — "never hardcode player keys
elsewhere." The config has exactly two players (`psn.config.json`), so `players[0]`/`players[1]`
map cleanly to `comparePlayers(a, b)`. Keeps the page correct if keys/display names change.

### Decision 2: Presentation stays bare semantic HTML (no CSS system introduced)

**Options considered:**
- Option A: Introduce a stylesheet with colored highlights / bars for the winning cell.
- Option B: Bare, accessible semantic HTML consistent with the current scaffold.

**Decision:** Option B — the "visual winner indicator" is realized semantically (a winner cell
containing the winning player's name, plus a `data-winner="a|b|tie"` attribute for a future styling
ticket to hook), not with new CSS.
**Rationale:** Every page shipped so far (#4 scaffold, #5 player page) is unstyled semantic markup;
the #5 plan made this an explicit, recorded decision. Introducing the repo's first CSS is a
separate concern and out of scope for this phase. A `data-winner` hook lets a later styling ticket
layer visuals without changing markup. **Reversible** — if a CSS scoreboard is preferred, only
`Scoreboard.tsx` (+ a new stylesheet) changes; the page/data wiring is unaffected.

### Decision 3: Humanize playtime values with `formatMinutes`

**Options considered:**
- Option A: Render the raw metric number (`playtimeMinutes` → `13737`).
- Option B: Format playtime with `formatMinutes` (`13737` → `"228h 57m"`).

**Decision:** Option B for the `playtimeMinutes` scoreboard row and both shared-game playtime cells;
all other metric rows render their integer value as-is.
**Rationale:** `PlayerPage` already presents durations via `formatMinutes` (`psn/duration`); raw
minutes would be inconsistent and hard to read. The scoreboard formats **per metric key** — only
`playtimeMinutes` is a duration; counts (games, trophies, platinums, shared-games) stay integers.
**Reversible** — localized to one formatter in `Scoreboard`.

### Decision 4: Two presentational components (`Scoreboard`, `SharedGames`) over one monolith

**Options considered:**
- Option A: Render both tables inline in `ComparePage`.
- Option B: Extract `Scoreboard` (metrics) and `SharedGames` (shared list) presentational components.

**Decision:** Option B.
**Rationale:** The two structures are independent and each has its own empty/tie behavior. Splitting
them mirrors the scaffold's single-responsibility component style (`GameSection`), keeps
`ComparePage` to data-selection + layout, and lets each table be unit-tested against a hand-built
`Comparison`-shaped prop. Both live in `site/src/components/`.

### Decision 5: Component tests inject snapshots by mocking `snapshotByKey`

**Options considered:**
- Option A: Test against the real committed `data/*/latest.json` imports.
- Option B: `vi.mock('../data')` and drive `snapshotByKey` per key with `sampleSnapshot`.

**Decision:** Option B for `ComparePage`, exactly as `PlayerPage.test.tsx` already does.
**Rationale:** The issue asks for tests "against fixture snapshots (`sampleSnapshot('dad', …)` vs
`sampleSnapshot('braidan', …)`)." `sampleSnapshot` is already re-exported from `psn` (added in #5).
Mocking `snapshotByKey` with a per-key `mockImplementation` yields deterministic dad-vs-braidan data
and lets a targeted test drive the empty/missing-snapshot branch by returning `undefined`.

## Security & Permissions

None. The site is a static, unauthenticated build reading committed public snapshots. No roles,
tokens, or access rules are involved.

## Error Handling

| Situation | Handling |
|---|---|
| Fewer than two configured players, or either snapshot `undefined` | Page-level empty state: heading + "Not enough data to compare yet." — never calls `comparePlayers` with a missing snapshot. |
| `comparison.sharedGames` is empty | `SharedGames` renders its heading + "No games in common yet." |
| A metric is a tie (`winner === 'tie'`) | Winner cell shows neutral text (e.g. "Tie"), `data-winner="tie"`, no player highlighted. |
| Broken image URL (fixture `image.example` host) | Shared-games rows are text-only (name + numbers); no `<img>` required, so nothing to degrade. |

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Component (scoreboard) | Unit | `site/src/components/Scoreboard.test.tsx` | Winner cell per metric; tie renders neutral; playtime row humanized. |
| Component (shared games) | Unit | `site/src/components/SharedGames.test.tsx` | Rows in given order; playtime formatted; empty-list message. |
| Page | Unit | `site/src/pages/ComparePage.test.tsx` (rewrite stub) | dad vs braidan via mocked `snapshotByKey`: names present, a known winner (Braidan wins playtime), a tie (games played), shared games (Rocket League®, God of War Ragnarök) present; missing-snapshot empty state. |

Test stack is already wired (Vitest + jsdom + `@testing-library/react` + `jest-dom`;
`site/vite.config.ts`, `site/src/setupTests.ts`). Follow the `PlayerPage.test.tsx` mock pattern.
`ComparePage` uses no router `Link`s, so `MemoryRouter` is only needed if a "back to home" link is
added (optional).

Known fixture facts (from `test/stats.test.ts` `describe('comparePlayers')`) usable as assertions:
Braidan wins `playtimeMinutes`; `gamesPlayed` is a tie; Dad has 2 platinums vs Braidan's 1; shared
games are exactly `Rocket League®` and `God of War Ragnarök`.

## Config Changes

- [ ] Schema / index changes — none required.
- [ ] Access rule changes — none required.
- [ ] Environment variables — none required.
- [ ] Dependency changes — none required (all libs already in `site/package.json`; `sampleSnapshot`
      is already re-exported from `psn` per #5).

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| Only one snapshot available at build time | Med | Empty state before calling `comparePlayers`; page never crashes on `undefined`. |
| Tie silently rendered as a win for player a | Med | Explicit `winner === 'tie'` branch → neutral "Tie" cell (AC + Decision 2). |
| Playtime shown as raw minutes, inconsistent with player page | Low | `formatMinutes` for playtime rows only (Decision 3). |
| Client re-sorts shared games and breaks the documented order | Low | Render `comparison.sharedGames` in place; never `.sort()` in the view. |
| Config has >2 players in future | Low | Page compares `players[0]` vs `players[1]`; documented assumption, matches current 2-player config. |
