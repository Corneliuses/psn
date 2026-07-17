# Design Doc — Phase 4: Player page redesign (#18)

## Overview

Redesign the per-player stats page (`site/src/pages/PlayerPage.tsx`) in the Design v1
language: a player **hero header** with a per-player accent and an ambient shape-glyph
backdrop, a **summary row of animated stat tiles** (games played, total trophies,
platinums), and the four existing game sections rendered through the redesigned
`GameSection` with a scroll/entrance stagger between them. It is a presentation-only
milestone — the one non-UI change is exposing an already-existing aggregation from
`src/stats` so the page reads numbers from the stats layer instead of recomputing them.

## Acceptance Criteria

- [ ] Player hero header: display name large, per-player accent assigned by config order
  (tokens, not hardcoded per key), subtle animated backdrop (shape glyphs drifting,
  `aria-hidden`, gated on reduced motion).
- [ ] Summary row of `StatTile`s with `AnimatedNumber` count-ups: games played, total
  trophies, platinum count — sourced from `src/stats` exports only (no ad-hoc stat logic
  in `site/`).
- [ ] Render the four existing sections (Recent games, Most played, Most trophies,
  Platinum games) through `GameSection`, with a scroll/entrance stagger between sections.
- [ ] Trophy metrics use `TrophyBadge` styling where a tier is known (platinum rows).
- [ ] Style the two fallback states in the same language: unknown player (`player == null`)
  and no snapshot (`snapshot == null` → "No stats synced yet.").
- [ ] `site/src/pages/PlayerPage.test.tsx` still passes: section headings and game rows
  located by role/name survive; extended for the stat tiles (final numbers asserted,
  count-up resolves instantly in jsdom).
- [ ] `pnpm --filter site lint`, `typecheck`, `test`, `build` all green — and the root
  package's `pnpm lint/typecheck/test/build` too (the stats change lives there).

## Architecture & Data Model

### Data Layer

No snapshot shape change. One **new exported stat function** in `src/stats`, promoted from
`compare.ts`'s currently-private `totals()`:

```ts
// src/stats/totals.ts (new)
export interface PlayerTotals {
  playtimeMinutes: number;
  gamesPlayed: number;
  trophies: TrophyCounts;
  trophiesTotal: number;
  platinums: number;
}
export function playerTotals(snapshot: PlayerSnapshot): PlayerTotals { /* moved from compare.ts */ }
```

`compare.ts` imports `playerTotals`/`PlayerTotals` from `./totals.js` (its local `totals()`
and `PlayerTotals` interface are deleted). `src/stats/index.ts` re-exports both; they reach
`site/` through the `psn/stats` package export.

Why this and not an inline reduce in the page: the earned-trophy aggregation already exists
in `compare.ts` and AGENTS.md requires derived numbers to live in `src/stats` with fixture
tests. Promoting the existing function is DRY, keeps the page a pure consumer, and is the
option confirmed with the issue author.

The three tile numbers then come out as:
`playerTotals(snapshot).gamesPlayed`, `.trophiesTotal`, `.platinums`.

### API / Service Layer

| Function | Type | Auth | Purpose |
|---|---|---|---|
| `playerTotals(snapshot)` | Pure (src/stats) | n/a | Aggregate per-player totals; games played, total trophies, platinum count for the summary row |
| `platinumGames`, `recentGames`, `mostPlayedGames`, `gamesWithMostTrophies` | Pure (src/stats) | n/a | Existing — feed the four `GameSection`s (unchanged) |

### UI Component Tree

```
PlayerPage
├── PlayerHero              (new, in PlayerPage.tsx) — h1 display name, accent, animated backdrop (aria-hidden)
├── section (summary row)
│   └── StatTile × 3        (Games played / Total trophies / Platinums, via AnimatedNumber)
└── motion.div (stagger container)
    └── GameSection × 4     (shapeIndex 0..3; each wrapped in a whileInView fadeRise item)
```

Per-player accent: new `site/src/config/accents.ts` exporting `accentForKey(key)`, which
indexes the player's position in `players` (config order) into the existing shape-accent
tokens (`shape-triangle | shape-circle | shape-cross | shape-square`), wrapping. No new
theme tokens; `ps-blue` stays the global brand accent.

## Key Decisions

### Decision 1: Where the "total trophies" number comes from

**Options considered:**
- Option A: Export a `src/stats` helper (promote `compare.ts`'s private `totals()` to
  `playerTotals`) with fixture tests; page consumes it.
- Option B: Sum `earnedTotal` across `trophyTitles` inline in `PlayerPage.tsx`.

**Decision:** Option A.
**Rationale:** No current `psn` export returns an aggregate earned-trophy total; the logic
exists only in `compare.ts`'s private `totals()`. AGENTS.md mandates derived numbers live in
`src/stats` with fixture tests. Promoting the existing function is DRY (compare.ts reuses it),
keeps `site/` a pure consumer, and was confirmed with the author.

### Decision 2: Per-player accent source

**Options considered:**
- Option A: Index config order into existing shape-accent tokens.
- Option B: Reuse `ps-blue` for every player (no differentiation).
- Option C: Add a new per-player accent token scale to `theme.css`.

**Decision:** Option A.
**Rationale:** Satisfies "per-player accent assigned by config order, tokens not hardcoded
per key" with zero theme expansion; `ps-blue` remains the global brand accent. Confirmed
with the author.

### Decision 3: Rendering `TrophyBadge` inside platinum game rows

**Options considered:**
- Option A: Widen `GameEntry.metric` from `string` to `ReactNode` so the platinum section can
  pass `<TrophyBadge tier="platinum" count={1} /> · …` as the metric.
- Option B: Add a dedicated `badge?: TrophyTier` prop to `GameEntry`/`GameSection`.

**Decision:** Option A.
**Rationale:** `string` is already a `ReactNode`, so widening the type is fully
backward-compatible — the other three sections keep passing plain strings and their tests
(`getByText('66 trophies')`, etc.) are unaffected. It is the smallest change to the #16 kit
that lets a known tier render as a `TrophyBadge`, and avoids a single-purpose prop.
**Scope note:** the issue names `PlayerPage.tsx` + `format.ts`; this adds a one-line type
widening to `site/src/components/GameSection.tsx`. Called out here as an intentional, minimal
in-scope deviation.

## Security & Permissions

None. The site is a static, unauthenticated build reading committed snapshots; no roles,
tokens, endpoints, or data-access rules are involved. No secrets touched.

## Error Handling

- **Unknown player** (`playerByKey` → `undefined`): styled not-found state; `h1` retains a
  name matching `/not found/i`. No stat tiles or sections rendered.
- **No snapshot** (`snapshotByKey` → `undefined`): styled empty state with `h1` containing
  the display name and the copy "No stats synced yet."; no level-2 headings rendered.
- **Non-resolving image URLs**: already handled by `GameSection` (neutral `surface-2` tile
  behind an empty-`alt` `<img>`); unchanged.
- **Reduced motion**: ambient backdrop drift and any glow pulse gated on `useReducedMotion()`
  (per the `HeroIllustration` precedent), since `MotionConfig reducedMotion="user"` only
  neutralizes transform/layout animations, not box-shadow/opacity loops.

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Stats | Unit / fixture | `test/stats.test.ts` | `playerTotals`: assert gamesPlayed/trophiesTotal/platinums on the `sampleSnapshot('dad', …)` fixture (4 / 150 / 2) **and** an empty-snapshot case (all zeros). AGENTS.md requires empty + tie coverage. |
| Stats | Unit (regression) | `test/compare.test.ts` (if present) | `comparePlayers` output unchanged after the `totals` → `playerTotals` refactor. |
| Config | Unit | `site/src/config/accents.test.ts` | `accentForKey` maps config order → shape tokens, wraps past the last token, and is stable per key. |
| Page | Unit | `site/src/pages/PlayerPage.test.tsx` | Keep: h1 `/Dad/`, four level-2 headings, existing game-row metric assertions. Extend: three stat-tile values (`4`, `150`, `2`) asserted within their labelled tiles; platinum rows asserted via `TrophyBadge` accessible name (`role="img"`, name `/platinum/i`, length 2) replacing the old `/^Platinum ·/` text assertion. Empty + not-found states preserved. |

Fixture math (`sampleSnapshot('dad', 'Dad')`): 4 played titles; earned totals 43 (GoW) + 41
(Elden Ring) + 66 (Rocket League) = **150** trophies; platinums 1 + 0 + 1 = **2**.

## Config Changes

- [ ] Schema / index changes — none required.
- [ ] Access rule changes — none required.
- [ ] Environment variables — none required.
- [ ] Dependency changes — none required (Tailwind 4 + Motion + component kit already present).

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| `compare.ts` refactor changes `comparePlayers` output | Med | Pure move of `totals()` → `playerTotals()`; keep the body identical and rely on existing compare tests as a regression gate. |
| Stat-tile numbers collide with other text nodes in tests (`2`, `4`) | Low | Query each value scoped to its tile (label + value in one `GlassCard`), not a bare `getByText`. |
| Widening `GameEntry.metric` to `ReactNode` breaks other consumers | Low | `string` ⊂ `ReactNode`; the three non-platinum sections and their `getByText` assertions are unchanged. Grep for other `GameEntry` consumers before landing. |
| Ambient backdrop keeps animating under reduced motion | Med (a11y) | Gate drift/glow on `useReducedMotion()`, following `HeroIllustration`; backdrop is `aria-hidden`. |
| Count-up shows `0` in jsdom and fails assertions | Low | `AnimatedNumber` renders the final value when it can't animate (no `matchMedia`); assert final numbers only. |
