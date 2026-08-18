# Task Doc — Phase 1: Roster foundation — add Nadia to config, data, and sync (#41)

> The three stages below are **one PR**, not three. They are ordered by dependency: the fixture
> library must exist before the snapshot can be generated, and the snapshot must exist before the
> site glob resolves it. Do not reorder.

## Prerequisites

- [ ] None — #41 is foundational and blocked by nothing.
- [ ] Working tree clean under `data/` before starting (`git status --porcelain data/`), so the
      dry-run clobber check in the Pre-Commit Gate is meaningful.

## Stage 1: Root package — fixtures, config, snapshot, workflow

- [ ] Add `NADIA_PLAYED: RawPlayedTitle[]` to `src/fixtures/sample.ts` (after `BRAIDAN_TROPHIES`,
      ~line 72), built with the existing `rawPlayed()` helper — 4 titles:
      `CUSA01433_00` Rocket League® (`category: 'ps4_game'`, shared with both),
      `PPSA13195_00` Astro Bot (shared with Braidan),
      `PPSA02342_00` Gran Turismo 7 (shared with Dad),
      and one title unique to her. Give each a distinct `playDuration`, `playCount`, and
      `lastPlayedDateTime` so orderings and tie-breaks stay unambiguous.
- [ ] Add `NADIA_TROPHIES: PsnTrophyTitle[]` to `src/fixtures/sample.ts` using `rawTrophy()` — 3
      entries matching a subset of her played titles, reusing the existing `npCommunicationId`s
      for shared games (`NPWR06904_00` Rocket League, `NPWR35123_00` Astro Bot) so cross-player
      trophy comparison works, with earned counts distinct from Dad's and Braidan's.
- [ ] Add `nadia: { played: NADIA_PLAYED, trophies: NADIA_TROPHIES }` to the `RAW` record in
      `src/fixtures/sample.ts:74-77`.
- [ ] Add a test to `test/map.test.ts` asserting `sampleRawResponses('nadia')` resolves and
      `sampleSnapshot('nadia', 'Nadia')` returns `schemaVersion: 1`, `player.key === 'nadia'`, and
      arrays sorted by `titleId` / `npCommunicationId`.
- [ ] Add the third player to `psn.config.json` (after the `braidan` entry, line 12):
      `{ "key": "nadia", "displayName": "Nadia", "auth": { "mode": "npsso", "envVar": "NPSSO_NADIA" } }`
- [ ] Generate `data/nadia/latest.json` from `sampleSnapshot('nadia', 'Nadia')` — write it with
      the same formatting rules the store uses (stable key order, 2-space indent, trailing
      newline; see `src/snapshot/store.ts`) so it stays diff-friendly. Do **not** generate it by
      running `pnpm sync --dry-run` at this stage — that would also overwrite Dad's and Braidan's
      real snapshots.
- [ ] Add `NPSSO_NADIA: ${{ secrets.NPSSO_NADIA }}` to the sync env block in
      `.github/workflows/sync.yml` (after line 47) and update the header comment (lines 3-9) to
      describe a three-token roster.
- [ ] Add an `NPSSO_NADIA=` line to `.env.example`, matching the existing entries' format
      (file could not be read during planning — check its actual shape first).
- [ ] Update the `NPSSO_DAD` and `NPSSO_BRAIDAN` secrets list in `README.md:30` to include
      `NPSSO_NADIA`. Broader family-language and docs rewrites stay with #45 / #47.

## Stage 2: Site — glob-based snapshot loading

- [ ] Replace the hardcoded imports and literal `snapshots` record at `site/src/data.ts:4-15`
      with a `LATEST_FILE_RE` + eager `import.meta.glob<{ default: PlayerSnapshot }>(
      '../../data/*/latest.json')` loop keyed by directory name (see the design doc for the exact
      shape). Keep the `suggestions.json` import as-is.
- [ ] Rewrite the `FIXTURE DATA` comment (`site/src/data.ts:4-7`) to reference **only**
      `data/nadia/latest.json` — Dad's and Braidan's are real synced data now, so the current
      comment is wrong.
- [ ] Confirm `snapshotByKey` and `snapshotsByKey` signatures and fallback behaviour are
      unchanged (`undefined` / `[]` for unknown keys), so no caller needs editing.
- [ ] Rewrite `site/src/data.test.ts:5-14` to iterate `psnConfig.players` (import
      `../../psn.config.json`, as `site/src/config/players.test.ts:3` does) and assert every
      configured player resolves a snapshot whose `player.key` matches — replacing the literal
      `dad`/`braidan` assertions. Keep the unconfigured-key case.
- [ ] Update `site/src/data.test.ts:16-29` (`snapshotsByKey`) the same way: assert ordered,
      non-empty history for every configured player rather than just `dad`.
- [ ] Add `expect(playerByKey('nadia')?.displayName).toBe('Nadia')` to
      `site/src/config/players.test.ts:11-14`.
- [ ] Bump the portal-card grid at `site/src/pages/SplashPage.tsx:61` from a fixed
      `sm:grid-cols-2` to a roster-size lookup with full literal class strings (1→`grid-cols-1`,
      2→`sm:grid-cols-2`, 3→`sm:grid-cols-2 lg:grid-cols-3`, default→`sm:grid-cols-2
      lg:grid-cols-4`) so Tailwind's scanner sees every class. Do **not** interpolate the count
      into a class name.
- [ ] Leave `SplashPage.tsx:89,98` (VS banner) and `ComparePage.tsx:32-33` untouched — #43.

## Stage 3: Docs, hygiene, and follow-ups

- [ ] Update the `data/` fixture exception in `AGENTS.md:163` to name **only**
      `data/nadia/latest.json`, and note that `data/dad` and `data/braidan` now hold real synced
      data.
- [ ] Create a follow-up issue: `sharedGenres` (`src/suggestions/stats.ts:107-119`) requires
      *every* player to have time in a genre, so a growing roster narrows suggestions toward
      empty — propose a ≥2-player or roster-weighted rule. Link it from #46.
- [ ] Create a follow-up issue: `pnpm sync --dry-run` writes fixture snapshots over real
      committed data via `writeSnapshot` (`src/cli/sync.ts:81`) — it should write to a temp dir or
      require an explicit `--out`.
- [ ] Confirm both follow-up issues are linked in the PR body where the work is deferred
      (AGENTS.md "Deferred work always gets a ticket").

## Manual Step (repo owner — an agent cannot do this)

- [ ] Obtain Nadia's NPSSO token: log in at playstation.com, then visit
      `ca.account.sony.com/api/v1/ssocookie` and copy the `npsso` value.
- [ ] Add it as the `NPSSO_NADIA` Actions repo secret under
      **Settings → Secrets and variables → Actions**.
- [ ] Trigger the `Daily sync` workflow manually ("Run workflow") to confirm the token works and
      to replace `data/nadia/latest.json` with real data.

Until this is done the nightly sync exits non-zero (Dad's and Braidan's snapshots still commit —
`sync.ts` isolates per-player failures). This is the accepted trade-off, not a bug.

## Pre-Commit Gate

Commands from `AGENTS.md` § Commands. All must be green before committing:

- [ ] `pnpm lint` ✅
- [ ] `pnpm typecheck` ✅
- [ ] `pnpm test` ✅
- [ ] `pnpm build` ✅
- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm --filter site typecheck` ✅
- [ ] `pnpm --filter site test` ✅
- [ ] `pnpm --filter site build` ✅
- [ ] `pnpm --filter site test:e2e` ✅ — smoke suite now covers `/nadia` from config; this is the
      only gate that catches a build-only break in the glob
- [ ] `pnpm sync --dry-run` exits 0 for all three players — **run this last**, then immediately
      `git checkout -- data/dad data/braidan` and verify `git status --porcelain data/` lists only
      `data/nadia/latest.json`. The dry run writes fixture data over real snapshots.

## Files Modified / Created

| File | Change |
|---|---|
| `src/fixtures/sample.ts` | Add `NADIA_PLAYED`, `NADIA_TROPHIES`, and the `nadia` entry in `RAW` |
| `psn.config.json` | Add the third player entry |
| `data/nadia/latest.json` | **New** — committed fixture snapshot pending her first real sync |
| `test/map.test.ts` | Add fixture coverage for `nadia` |
| `site/src/data.ts` | Replace hardcoded imports with an eager `import.meta.glob`; correct the stale FIXTURE comment |
| `site/src/data.test.ts` | Rewrite over `psnConfig.players` instead of literal keys |
| `site/src/config/players.test.ts` | Add the `nadia` lookup assertion |
| `site/src/pages/SplashPage.tsx` | Roster-size-driven portal-card grid columns |
| `.github/workflows/sync.yml` | Add `NPSSO_NADIA` to the sync env block; update the header comment |
| `.env.example` | Add `NPSSO_NADIA=` |
| `README.md` | Add `NPSSO_NADIA` to the required-secrets list (line 30) |
| `AGENTS.md` | Correct the `data/` fixture exception to name only `data/nadia/latest.json` |
