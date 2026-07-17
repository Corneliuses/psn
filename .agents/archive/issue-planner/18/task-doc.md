# Task Doc — Phase 4: Player page redesign (#18)

## Prerequisites

- [ ] #16 (Phase 2: component kit) merged — **satisfied**: `GlassCard`, `TrophyBadge`,
  `StatTile`, `SectionHeader`, `AnimatedNumber`, `GameSection` all present in
  `site/src/components/`.
- [ ] Motion presets (`site/src/motion/presets.ts`) and theme tokens
  (`site/src/styles/theme.css`) present — **satisfied**.

## Phase 1: Stats layer — expose `playerTotals`

- [ ] Create `src/stats/totals.ts`: move the `PlayerTotals` interface and the private
  `totals()` function out of `src/stats/compare.ts`; export them as `PlayerTotals` and
  `playerTotals(snapshot: PlayerSnapshot): PlayerTotals` (body unchanged).
- [ ] Update `src/stats/compare.ts`: delete the local `PlayerTotals` interface and `totals()`;
  `import { playerTotals, type PlayerTotals } from './totals.js'` and call `playerTotals(...)`
  where it currently calls `totals(...)`.
- [ ] Update `src/stats/index.ts`: add `export { playerTotals } from './totals.js';` and
  `export type { PlayerTotals } from './totals.js';` (keep the existing `compare` re-exports).
- [ ] Add fixture tests for `playerTotals` in `test/stats.test.ts`: assert
  `gamesPlayed === 4`, `trophiesTotal === 150`, `platinums === 2` on
  `sampleSnapshot('dad', 'Dad')`, plus an empty-snapshot case
  (`{ ...snapshot, playedTitles: [], trophyTitles: [] }`) returning all zeros.
- [ ] Confirm existing `comparePlayers` tests still pass (regression gate for the refactor).

## Phase 2: Site — hero, stat tiles, section stagger, fallbacks

- [ ] Create `site/src/config/accents.ts`: export `accentForKey(key: string)` returning the
  shape-accent token(s) for the player's index in `players` (from
  `site/src/config/players.ts`), wrapping over `['shape-triangle','shape-circle','shape-cross','shape-square']`.
  Return whatever shape the hero needs (e.g. `{ text: 'text-shape-…', fill: 'fill-shape-…' }`).
- [ ] Add `site/src/config/accents.test.ts`: config order → token mapping, wrap-around past
  the last token, and stability per key.
- [ ] In `site/src/pages/PlayerPage.tsx`, add a `PlayerHero` block: large `h1` with
  `player.displayName` (keep the display name in the h1 so the `/Dad/` assertion survives),
  accent from `accentForKey(playerKey)`, and an `aria-hidden` animated shape-glyph backdrop
  composing `site/src/motion/presets.ts`; gate drift/glow on `useReducedMotion()`.
- [ ] Add the summary row: three `StatTile`s fed from `playerTotals(snapshot)` —
  `{ label: 'Games played', value: totals.gamesPlayed }`,
  `{ label: 'Total trophies', value: totals.trophiesTotal }`,
  `{ label: 'Platinums', value: totals.platinums }` — in a responsive grid.
  Import `playerTotals` from `psn/stats`; **no aggregation logic in the page**.
- [ ] Widen `GameEntry.metric` in `site/src/components/GameSection.tsx` from `string` to
  `ReactNode` (one-line type change; import `ReactNode` from `react`). Grep for other
  `GameEntry` consumers first to confirm none break.
- [ ] In `sectionEntries`, change the Platinum section's `metric` to render a
  `<TrophyBadge tier="platinum" count={1} />` alongside the trophy count and date, keeping the
  other three sections' string metrics as-is. Pass `shapeIndex={0..3}` per section.
- [ ] Wrap the four `GameSection`s in a `motion.div` stagger container with each section as a
  `whileInView` `fadeRise` item (`viewport={{ once: true }}`) for scroll/entrance stagger.
- [ ] Restyle the two fallback states in the design language: not-found (`h1` name matching
  `/not found/i`) and no-snapshot (`h1` with display name + "No stats synced yet.", no
  level-2 headings).

## Phase 3: Tests & gate

- [ ] Extend `site/src/pages/PlayerPage.test.tsx`:
  - Keep the h1 `/Dad/` assertion, the four level-2 heading assertions, and the existing
    non-platinum metric assertions (`210h 4m`, `66 trophies`, `Last played Jul 14, 2026`).
  - Add stat-tile assertions: values `4`, `150`, `2` located **within their labelled tiles**
    (find the label text, assert the value in the same `GlassCard`), not bare `getByText`.
  - Replace the `/^Platinum ·/` text assertion with a `TrophyBadge` accessible-name query:
    `screen.getAllByRole('img', { name: /platinum/i })` has length 2.
  - Keep the empty-state and not-found tests green.

## Pre-Commit Gate

Commands from `AGENTS.md` → `## Commands`. Run and confirm green **before committing** — both
packages, because Phase 1 touches the root package and Phase 2/3 touch `site/`:

Root package (data layer):
- [ ] `pnpm lint` ✅
- [ ] `pnpm typecheck` ✅
- [ ] `pnpm test` ✅
- [ ] `pnpm build` ✅

Site workspace:
- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm --filter site typecheck` ✅
- [ ] `pnpm --filter site test` ✅
- [ ] `pnpm --filter site build` ✅

## Files Modified / Created

| File | Change |
|---|---|
| `src/stats/totals.ts` | **New** — `PlayerTotals` + `playerTotals()` (moved from `compare.ts`). |
| `src/stats/compare.ts` | Delete local `PlayerTotals`/`totals()`; import + use `playerTotals`. |
| `src/stats/index.ts` | Re-export `playerTotals` and `PlayerTotals`. |
| `test/stats.test.ts` | Add `playerTotals` fixture tests (dad + empty snapshot). |
| `site/src/config/accents.ts` | **New** — `accentForKey()` mapping config order → shape tokens. |
| `site/src/config/accents.test.ts` | **New** — accent mapping/wrap/stability tests. |
| `site/src/pages/PlayerPage.tsx` | Hero header, summary `StatTile` row, section stagger, `TrophyBadge` platinum metric, restyled fallbacks. |
| `site/src/components/GameSection.tsx` | Widen `GameEntry.metric` to `ReactNode`. |
| `site/src/pages/PlayerPage.test.tsx` | Extend for stat tiles + platinum `TrophyBadge`; preserve heading/row/fallback assertions. |
