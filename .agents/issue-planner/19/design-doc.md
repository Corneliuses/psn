# Design Doc — Phase 5: Compare page — head-to-head VS showdown (#19, closes #6)

## Overview

`/compare` is currently a "Coming soon." stub (`site/src/pages/ComparePage.tsx:1-8`). This
issue builds it out as the design showcase of the Design v1 milestone: a VS hero, an animated
head-to-head metric scoreboard, a dedicated trophy-tier block, and a shared-games deep list —
all driven by the already-complete `comparePlayers` data layer. The PR closes #6 (the functional
compare feature) as well, folding its checklist into the visual design.

## Acceptance Criteria

- [ ] AC1 — Page calls `comparePlayers(a, b)` with the two snapshots from `snapshotByKey`, in config order (players[0] = "a", players[1] = "b").
- [ ] AC2 — A missing snapshot for either player renders a styled empty state (no crash).
- [ ] AC3 — VS hero: both display names facing off with per-player accent colors and a decorative (`aria-hidden`) spark/lightning divider motif, entering with a staggered animation.
- [ ] AC4 — Metric scoreboard renders `comparison.metrics`: each row shows the label, both values, and an animated proportional bar per side. The winning side glows in that player's accent, driven by `metric.winner`.
- [ ] AC5 — `winner === 'tie'` renders a neutral treatment (no glow toward either player). Covered by an explicit test.
- [ ] AC6 — Trophy-tier metrics (bronze/silver/gold/platinum) render in a dedicated block using `TrophyBadge` metal colors.
- [ ] AC7 — Shared-games deep list renders from `comparison.sharedGames` (pre-sorted by combined playtime): game name, each player's playtime (`formatMinutes`) and trophies earned, in `GlassCard` rows.
- [ ] AC8 — Zero shared games renders a styled empty state. Covered by an explicit test.
- [ ] AC9 — Component tests against fixtures (`sampleSnapshot('dad', …)` vs `sampleSnapshot('braidan', …)`) cover: metric rows render with winner indication, the tie case, and the zero-shared-games case.
- [ ] AC10 — `pnpm --filter site lint`, `typecheck`, `test`, and `build` all pass.

## Architecture & Data Model

### Data Layer

No data-layer changes. Everything the page needs already exists and is exported from the `psn`
package:

- `comparePlayers(a, b): Comparison` — `src/stats/compare.ts:42`
- Types `Comparison`, `MetricComparison` (`{ metric, label, a, b, winner: 'a' | 'b' | 'tie' }`),
  `SharedGame`, `PlayerTotals` — re-exported via `src/stats/index.ts` → `psn`.
- `formatMinutes` — `psn/duration` (also re-exported from `psn`).

`comparison.metrics` order (from `compare.ts:69-78`):
`playtimeMinutes`, `gamesPlayed`, `trophiesTotal`, `bronze`, `silver`, `gold`, `platinums`,
`sharedGames`. The page splits these into three groups by `metric` key:

| Group | Metric keys | Value formatting |
|---|---|---|
| Headline scoreboard | `playtimeMinutes`, `gamesPlayed`, `trophiesTotal`, `sharedGames` | `playtimeMinutes` via `formatMinutes`; rest raw counts |
| Trophy tiers | `bronze`, `silver`, `gold`, `platinum` | raw counts, tier-tinted |
| (shared-games count) | `sharedGames` | always a tie by construction — natural neutral-row case in the headline group |

> The split is by a fixed set of metric keys, not by array index, so it stays correct even if the
> data layer reorders the array.

### API / Service Layer

| Endpoint / Function | Type | Auth | Purpose |
|---|---|---|---|
| `comparePlayers` | Internal (existing) | n/a (static site) | Produces the UI-ready `Comparison` |

No new endpoints — this is a static, client-rendered page over bundled snapshot JSON.

### UI Component Tree

```
ComparePage
├─ (missing snapshot?) → CompareEmptyState        [styled empty state — AC2]
└─ VsHero                                          [AC3: names, accents, spark divider]
   MetricScoreboard   (heading "Head to head")     [AC4/AC5: headline metrics rows]
   └─ ScoreboardRow × N   (playtime, games, total trophies, shared games count)
      └─ opposing proportional bars (per side) + values + winner glow
   TrophyTiers        (heading "Trophy tiers")      [AC6: bronze/silver/gold/platinum]
   └─ ScoreboardRow × 4   (tier-tinted, TrophyBadge colors)
   SharedGamesList    (heading "Shared games")      [AC7/AC8]
   └─ GlassCard row × N  |  CompareEmptyState (zero shared games)
```

New files under `site/src/components/`:
- `VsHero.tsx` — the VS hero banner.
- `ScoreboardRow.tsx` — one metric row: label + two opposing proportional bars + both values +
  winner glow. Reused by both the headline scoreboard and the trophy-tiers block.
- `MetricScoreboard.tsx` — groups headline `ScoreboardRow`s under a `SectionHeader`.
- `TrophyTiers.tsx` — groups the four tier `ScoreboardRow`s (tier-tinted) under a `SectionHeader`.
- `SharedGamesList.tsx` — the shared-games deep list + zero-state.

> Grouping vs. one mega-component: the page composes small, independently testable pieces that
> mirror the existing `GameSection` / `StatTile` granularity, keeping each unit's accessible
> contract narrow.

## Key Decisions

### Decision 1: Head-to-head bar model

**Options considered:**
- Option A: Two opposing bars per metric row — one per player, each filled to `value / max(a, b)`.
- Option B: A single center-split bar divided `a : b`.

**Decision:** Option A (two opposing bars per row).
**Rationale:** Gives the clearest "who's ahead" read; the winner's bar reaches full width and
glows while the loser's is a visible fraction. It handles ties trivially (both bars equal, no
glow) and the zero/zero shared-games-count row without a divide-by-zero guard (when `max === 0`,
both fills are 0). A center-split bar would need special casing for both. Aligns with the
proportional, animated-fill intent in the issue and composes cleanly from the shared `fadeRise` /
width-transition presets.

### Decision 2: Trophy tiers in a dedicated block

**Options considered:**
- Option A: A separate "Trophy tiers" section after the headline scoreboard, rows tinted with
  `TrophyBadge` metal colors.
- Option B: One unified scoreboard with tier rows interleaved.

**Decision:** Option A (dedicated block).
**Rationale:** Matches the issue's separate bullets for "metric scoreboard" and "trophy tier
metrics," gives the four tiers a distinct visual identity tied to the trophy metal tokens, and
keeps the headline scoreboard focused on the top-line stats. `ScoreboardRow` is shared across both,
so there's no duplication — the block just passes a tier tint.

### Decision 3: Bar fill animation is presentational-only and test-safe

**Options considered:**
- Option A: Animate bar widths with Motion, gating on reduced motion / jsdom like `AnimatedNumber`.
- Option B: CSS-only transition.

**Decision:** Option A pattern — render the final width immediately when animation can't/shouldn't
run (reduced motion, jsdom), animate the fill on entrance otherwise.
**Rationale:** Consistent with `AnimatedNumber` (`components/AnimatedNumber.tsx`) and keeps the
final, assertable state present on first paint so component tests need no timers. The numeric
values themselves are always rendered as text (assertable), independent of the bar.

## Security & Permissions

No auth surface. This is a static, unauthenticated site rendering bundled fixture snapshots
(`site/src/data.ts`). No roles, tokens, or access rules are involved. Not in scope for any of the
security/auth scope questions.

## Error Handling

| Condition | Handling |
|---|---|
| Either player's snapshot missing (`snapshotByKey` returns `undefined`) | Render `CompareEmptyState` with a friendly message; never call `comparePlayers` with an undefined snapshot. |
| Fewer than 2 configured players | Guard: if `players[0]` or `players[1]` is absent, render the empty state (defensive; config always has ≥2 today). |
| Zero shared games | `SharedGamesList` renders its styled empty state instead of an empty list. |
| Bar with `max(a,b) === 0` (e.g. both players 0 in a tier) | Both fills are 0%, no glow — no divide-by-zero. |
| Non-resolving fixture image URLs | N/A here (no game icons in the shared-games rows beyond text); if added later, follow `GameSection`'s neutral-tile pattern. |

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Data layer (`comparePlayers`) | Unit (existing) | `test/stats.test.ts` | Already covers ties, empty opponent, name normalization — **not** re-tested here. |
| Page | Component | `site/src/pages/ComparePage.test.tsx` | Mock `snapshotByKey` (per `PlayerPage.test.tsx` pattern): real dad-vs-braidan for the happy path, one non-overlapping snapshot for zero-shared, `undefined` for missing-snapshot empty state. |
| `ScoreboardRow` | Component | `site/src/components/ScoreboardRow.test.tsx` | Winner-a glow, winner-b glow, tie neutral (no glow), both values rendered as text. |
| `VsHero` | Component | `site/src/components/VsHero.test.tsx` | Both display names present; divider is `aria-hidden`. |
| `SharedGamesList` | Component | `site/src/components/SharedGamesList.test.tsx` | Rows render name + both playtimes (`formatMinutes`) + trophies; zero-shared empty state. |

Fixture facts that anchor assertions (from `src/fixtures/sample.ts` + `test/stats.test.ts`):
dad vs braidan → `platinums` winner = **a** (2 vs 1), `playtimeMinutes` winner = **b**,
`gamesPlayed` = **tie** (4 vs 4), `sharedGames` count = **tie** (2 vs 2), shared games =
"God of War Ragnarök" + "Rocket League®". This one fixture pair naturally exercises winner-a,
winner-b, and both tie kinds.

## Config Changes

- [ ] Schema / index changes — none required (static site, no DB).
- [ ] Access rule changes — none required.
- [ ] Environment variables — none required.
- [ ] Dependency changes — none required (`motion`, `psn`, testing-library already present).

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| One or both snapshots missing | Med | Guarded empty state before `comparePlayers`; explicit test. |
| Metric with both values 0 (tie tier / shared-games-count) | Low | `max===0` → 0% fills, no glow; tie treatment. Explicit tie test. |
| Data layer reorders `metrics` array later | Low | Group rows by `metric` key, never by array index. |
| Bar animation running under jsdom/reduced motion breaks tests | Med | Render final width immediately when not animatable (AnimatedNumber pattern); assert on text values, not bar geometry. |
| Winner glow relies on correct per-player accent | Low | Use `accentForKey(players[i].key)` (config order), same source as PlayerPage/Splash. |
| Name normalization (Rocket League® PS4 vs PS5) | Low | Already handled in `comparePlayers`; page just renders `sharedGames`. |
