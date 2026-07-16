# Design Doc — Phase 2: Individual player stats page (#5)

## Overview

Turn the placeholder `PlayerPage` (shipped as a stub in #4) into a real per-player stats page
served at `/dad` and `/braidan`. It reads the player's committed `latest.json` snapshot and
renders four sections — recent games, most played, most trophies, and all platinum games —
using the pure stat functions already in `src/stats`. Frontend-only work; the data layer is
already sufficient.

## Acceptance Criteria

- [ ] `PlayerPage` reads the player's snapshot via `snapshotByKey(playerKey)` (`site/src/data.ts`).
- [ ] "Recent games" section rendered from `recentGames(snapshot)`.
- [ ] "Most played" section rendered from `mostPlayedGames(snapshot)`.
- [ ] "Most trophies" section rendered from `gamesWithMostTrophies(snapshot)`.
- [ ] "Platinum games" section rendered from `platinumGames(snapshot)`, showing **all** results (untruncated).
- [ ] Each game entry shows an icon, the game name, and the section's relevant metric
      (play duration via `formatMinutes`, trophy counts, or last-played date).
- [ ] Empty-snapshot case handled gracefully — a configured player with no synced data yet
      renders a friendly empty state instead of crashing.
- [ ] Component tests cover each section against a fixture snapshot and cover the empty case.
- [ ] `site` lint, typecheck, test, and build all pass.

## Architecture & Data Model

### Data Layer

No new data structures. The page consumes existing shapes:

- `PlayerSnapshot` (`src/psn/models.ts`) via the `psn` workspace package.
- `PlayedTitle` — rendered by *Recent* and *Most played* (fields: `imageUrl`, `name`,
  `playDurationMinutes`, `lastPlayed`).
- `TrophyTitleStats` — rendered by *Most trophies* and *Platinum* (fields: `iconUrl`, `name`,
  `earned`, `earnedTotal`, `hasPlatinum`, `lastTrophyAt`).

`snapshotByKey` already returns `PlayerSnapshot | undefined` from the committed
`data/<player>/latest.json` imports — no change needed there.

### API / Service Layer

Pure functions consumed from the `psn` package (already re-exported by `src/index.ts`, no
change required):

| Function | Type | Auth | Purpose |
|---|---|---|---|
| `recentGames(snapshot, limit=10)` | Pure (internal) | n/a | Newest-played `PlayedTitle[]` |
| `mostPlayedGames(snapshot, limit=10)` | Pure (internal) | n/a | Longest-played `PlayedTitle[]` |
| `gamesWithMostTrophies(snapshot, limit=10)` | Pure (internal) | n/a | Most-earned `TrophyTitleStats[]` |
| `platinumGames(snapshot)` | Pure (internal) | n/a | All platinum'd `TrophyTitleStats[]` (untruncated) |
| `formatMinutes(minutes)` | Pure (internal) | n/a | `5800` → `"96h 40m"` |

### UI Component Tree

```
PlayerPage (site/src/pages/PlayerPage.tsx)
├─ not-found state        (unknown key → existing behaviour, kept)
├─ empty state            (configured player, snapshot missing/empty)
└─ four <GameSection>s
   └─ GameSection (site/src/components/GameSection.tsx)
      ├─ <h2> heading
      ├─ empty-list message  ("No games yet")
      └─ list of GameEntry rows: <img icon> + name + metric text
```

`PlayerPage` maps each stat function's output into a common view-model array
(`GameEntry = { id; iconUrl; name; metric }`) so one presentational `GameSection`
renders all four sections. This keeps the two underlying shapes
(`PlayedTitle` vs `TrophyTitleStats`) out of the presentational component and makes it
trivial to unit-test.

## Key Decisions

### Decision 1: Trophy icon field is `iconUrl`, not `trophyTitleIconUrl`

**Options considered:**
- Option A: Use `trophyTitleIconUrl` as literally written in the issue.
- Option B: Use `iconUrl`, the field on the mapped domain type `TrophyTitleStats`.

**Decision:** Option B — `iconUrl`.
**Rationale:** `trophyTitleIconUrl` is the *raw* psn-api field name (see `src/fixtures/sample.ts`
`rawTrophy`); `src/psn/map.ts` maps it to `iconUrl` on `TrophyTitleStats` (`src/psn/models.ts:31`).
The page renders domain types, so `iconUrl` is correct; `trophyTitleIconUrl` would not typecheck.
`PlayedTitle` correctly uses `imageUrl`, exactly as the issue states.

### Decision 2: One normalized `GameSection` component over four bespoke sections

**Options considered:**
- Option A: A section component per stat (RecentSection, MostPlayedSection, …).
- Option B: A single `GameSection` fed a `GameEntry[]` view-model built in `PlayerPage`.

**Decision:** Option B.
**Rationale:** The four sections differ only in heading, source function, and how the metric
string is derived. Normalizing to `{ id, iconUrl, name, metric }` in `PlayerPage` removes
duplication, isolates the two domain shapes to one mapping site, and lets the presentational
component be tested once. Mirrors the scaffold's lean, single-responsibility component style
(`PlaceholderGraphic`, page components).

### Decision 3: Presentation stays bare semantic HTML (no CSS system introduced)

**Options considered:**
- Option A: Introduce a styling approach (CSS modules / stylesheet) for the stats layout.
- Option B: Bare, accessible semantic HTML consistent with the current scaffold.

**Decision:** Option B.
**Rationale:** The #4 scaffold ships zero CSS — every page is unstyled semantic markup. Adding a
styling system is a separate concern and out of scope for this ticket. Use `<section>`, `<h2>`,
lists, and `<img>` with `alt` text now; a dedicated styling ticket can layer visuals later.

### Decision 4: Fixture for component tests via `sampleSnapshot`, re-exported from `psn`

**Options considered:**
- Option A: Duplicate fixture-building logic inline in the site test.
- Option B: Import committed `data/dad/latest.json` in the test.
- Option C: Re-export `sampleSnapshot` from `src/index.ts` and import it in site tests.

**Decision:** Option C, plus a small inline empty snapshot for the empty-state test.
**Rationale:** The issue asks to "reuse `src/fixtures/sample.ts` patterns" and test "against a
fixture snapshot". `sampleSnapshot` already produces a realistic, typed `PlayerSnapshot`;
re-exporting it (one line in `src/index.ts`, the public barrel) avoids duplicating that logic in
the site and keeps tests honest against the real mapping. This does **not** touch `src/stats` or
`src/psn` — the scope's explicit no-go zones — it only widens the package's public surface. The
empty-snapshot fixture (`{ schemaVersion: 1, player, capturedAt, playedTitles: [], trophyTitles: [] }`)
is constructed inline since `sampleSnapshot` always carries data.

### Decision 5: Date formatting via a small site-local `formatDate` helper (UTC-pinned)

**Options considered:**
- Option A: Inline `toLocaleDateString()` at each call site.
- Option B: A `site/src/format.ts` `formatDate(iso)` using `Intl.DateTimeFormat` with `timeZone: 'UTC'`.

**Decision:** Option B.
**Rationale:** Recent games and platinum games display dates. Pinning `timeZone: 'UTC'` makes
output deterministic across machines and CI, so component tests can assert exact strings.
Date formatting is pure presentation, so it belongs in `site/`, not the `psn` data package
(which only owns `formatMinutes` for durations).

## Security & Permissions

None. The site is a static, unauthenticated build reading committed public snapshots. No roles,
tokens, or access rules are involved. (No `frontend` auth-gated routes exist in this project.)

## Error Handling

| Situation | Handling |
|---|---|
| Unknown `playerKey` (route not configured) | Existing "Player not found" heading, kept as-is. |
| Configured player, snapshot `undefined` | Page-level empty state: heading + "No stats synced yet." |
| Snapshot present but a section's list is empty | `GameSection` renders its heading + "No games yet." |
| Broken image URL (fixture `image.example` host) | `<img>` always carries `alt={name}`; a broken image degrades to alt text, no crash. |

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Component (section) | Unit | `site/src/components/GameSection.test.tsx` | Renders entries (icon alt, name, metric); renders empty-list message. |
| Page | Unit | `site/src/pages/PlayerPage.test.tsx` (rewrite stub) | All four section headings present; sample metrics rendered (e.g. a `formatMinutes` duration, a trophy count, a date); not-found state; empty-snapshot state. |

Test stack is already wired: Vitest + jsdom + `@testing-library/react` + `jest-dom` matchers
(`site/vite.config.ts`, `site/src/setupTests.ts`). Follow the existing `SplashPage.test.tsx` /
`PlayerPage.test.tsx` patterns. `PlayerPage` uses no router `Link`s, so `MemoryRouter` is not
required unless a "back to home" link is added (optional; if added, wrap renders in `MemoryRouter`).

## Config Changes

- [ ] Schema / index changes — none required.
- [ ] Access rule changes — none required.
- [ ] Environment variables — none required.
- [ ] Dependency changes — none required (all libs already in `site/package.json`).
- [ ] Public export — add `sampleSnapshot` to `src/index.ts` re-exports (test enabler; see Decision 4).

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| Issue's `trophyTitleIconUrl` field doesn't exist on domain type | Low | Use `iconUrl` (Decision 1); caught by typecheck regardless. |
| Player has data but no platinum games | Low | `GameSection` empty-list message; platinum section still renders its heading. |
| Fixture image URLs (`image.example`) never load in a browser | Low | `alt` text on every `<img>`; real snapshots (#8) carry valid URLs. |
| Locale/timezone drift makes date assertions flaky | Med | `formatDate` pins `timeZone: 'UTC'` and explicit `Intl` options (Decision 5). |
| Over-truncating platinum list | Low | Call `platinumGames(snapshot)` with no limit; AC explicitly requires all. |
