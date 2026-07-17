# Task Doc — Phase 5: Compare page — head-to-head VS showdown (#19, closes #6)

## Prerequisites

- [ ] #16 (Phase 2: component kit) landed — **satisfied**: `GlassCard`, `TrophyBadge`, `StatTile`,
      `AnimatedNumber`, `SectionHeader`, and `motion/presets` all exist under `site/src/`.
- [ ] `comparePlayers` and its types exported from `psn` — **satisfied** (`src/stats/index.ts`).

No blocking work remains; this issue can start immediately. It can run in parallel with #17
(Splash) and #18 (Player page); it blocks #20 (motion polish).

## Phase 1: Compare-specific components

- [ ] Add `site/src/components/VsHero.tsx` — props `{ nameA, nameB, keyA, keyB }`; renders both
      display names with `accentForKey(key)` accents and a decorative (`aria-hidden`) spark/lightning
      divider glyph; staggered entrance via `staggerChildren` + `fadeRise` from `../motion/presets`.
- [ ] Add `site/src/components/ClashMeter.tsx` — props roughly
      `{ label, a, b, winner: 'a'|'b'|'tie', accentA, accentB, format?, tint? }`;
      renders the label, a contested track with a glowing spark seam at position `a/(a+b)`
      (`0.5` when `a+b===0`), both formatted values as count-up text at the ends, winner side
      saturated + glowing in its accent and loser side dimmed (none on tie). Seam slides from center
      on entrance but renders final position immediately under reduced motion / jsdom (mirror
      `AnimatedNumber` in `components/AnimatedNumber.tsx`); spark glyph is `aria-hidden`.
- [ ] Add `site/src/components/MetricScoreboard.tsx` — takes the `Comparison`, selects the headline
      metrics by key (`playtimeMinutes` formatted via `formatMinutes`, `gamesPlayed`, `trophiesTotal`,
      `sharedGames`), renders a `SectionHeader title="Head to head"` + one `ClashMeter` each.
- [ ] Add `site/src/components/TrophyTiers.tsx` — selects `bronze`/`silver`/`gold`/`platinum` metrics
      by key, renders `SectionHeader title="Trophy tiers"` + one tier-tinted `ClashMeter` each
      (tint from `TrophyBadge`'s `text-trophy-*` tokens).
- [ ] Add `site/src/components/SharedGamesList.tsx` — `SectionHeader title="Shared games"` + one
      `GlassCard` row per `SharedGame` (name, both playtimes via `formatMinutes`, both trophies
      earned); zero games → a styled empty-state paragraph inside a `GlassCard`.
- [ ] Write component tests:
  - `site/src/components/ClashMeter.test.tsx` (winner-a glow, winner-b glow, tie neutral/centered seam, values as text)
  - `site/src/components/VsHero.test.tsx` (both names present, divider `aria-hidden`)
  - `site/src/components/SharedGamesList.test.tsx` (rows render fields; zero-shared empty state)

## Phase 2: Compose the page

- [ ] Rewrite `site/src/pages/ComparePage.tsx`:
  - Read `players[0]`/`players[1]` from `../config/players`; if either missing → `CompareEmptyState`.
  - `snapshotByKey(players[i].key)` for both; if either `undefined` → styled empty state (no
    `comparePlayers` call).
  - `const comparison = comparePlayers(snapA, snapB)`.
  - Render `<VsHero>`, `<MetricScoreboard>`, `<TrophyTiers>`, `<SharedGamesList>` inside a
    `<main className="mx-auto max-w-5xl px-4 py-10">` wrapper (match PlayerPage layout).
  - Winner accents come from `accentForKey(players[i].key)`.
- [ ] Add the shared empty-state markup (inline small component or local helper) styled like
      PlayerPage's "No stats synced yet" `GlassCard`.
- [ ] Write `site/src/pages/ComparePage.test.tsx` (mock `../data`'s `snapshotByKey` per
      `PlayerPage.test.tsx`):
  - Happy path: real `sampleSnapshot('dad','Dad')` vs `sampleSnapshot('braidan','Braidan')` — assert
    a winner-indicated row (e.g. platinums → a), the tie row (games played), shared games list shows
    "God of War Ragnarök" and "Rocket League®".
  - Zero shared games: two non-overlapping snapshots → shared-games empty state renders.
  - Missing snapshot: `snapshotByKey` returns `undefined` → compare empty state, no metric rows.

## Pre-Commit Gate

Run from the repo root (commands from `AGENTS.md` → `site/` workspace commands). All must be green
before committing:

- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm --filter site typecheck` ✅
- [ ] `pnpm --filter site test` ✅
- [ ] `pnpm --filter site build` ✅

> Root-package checks are unaffected (no `src/` changes), but a quick `pnpm test` at root confirms
> the data-layer suite still passes.

## Files Modified / Created

| File | Change |
|---|---|
| `site/src/pages/ComparePage.tsx` | Rewrite stub → full compare page composition + empty states |
| `site/src/pages/ComparePage.test.tsx` | New — happy path, zero-shared, missing-snapshot |
| `site/src/components/VsHero.tsx` | New — VS hero banner |
| `site/src/components/VsHero.test.tsx` | New |
| `site/src/components/ClashMeter.tsx` | New — clash-meter metric row (spark seam) with winner glow |
| `site/src/components/ClashMeter.test.tsx` | New |
| `site/src/components/MetricScoreboard.tsx` | New — headline metrics group |
| `site/src/components/TrophyTiers.tsx` | New — tier-tinted metrics group |
| `site/src/components/SharedGamesList.tsx` | New — shared-games deep list + empty state |
| `site/src/components/SharedGamesList.test.tsx` | New |
