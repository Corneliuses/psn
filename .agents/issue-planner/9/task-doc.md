# Task Doc — Phase 6: Research spike — game suggestions for titles we don't own (#9)

## Prerequisites

- [ ] User provides `RAWG_API_KEY` (rawg.io/apidocs signup) and `IGDB_TWITCH_CLIENT_ID` /
  `IGDB_TWITCH_CLIENT_SECRET` (dev.twitch.tv app) — needed at the start of Phase 2. Phase 1 desk
  research can begin without them.
- [ ] No blocking issues: #9 is parallel to everything in the milestone.

## Phase 1: Desk research & PSN-side check

- [ ] Answer the `psn-api` question: inspect `psn-api`'s exports and types (already a dependency —
  see `src/psn/api.ts`) for any store/catalog/genre surface; specifically check what the dropped
  `concept` field on `RawPlayedTitle` contains at runtime (log it from a real snapshot fetch is
  NOT possible without NPSSO — instead check `psn-api` type defs in
  `node_modules/psn-api/dist/index.d.ts` and its docs). Record the answer for the doc.
- [ ] Desk-evaluate the three candidates on: auth complexity, rate limits/free-tier terms, genre
  taxonomy, PS4/PS5 platform filtering, "similar games" support, licensing/attribution
  requirements. Sources: IGDB docs (api-docs.igdb.com), RAWG docs (rawg.io/apidocs), plus a
  worked `suggestions.json` shape for the curated option.
- [ ] Draft the comparison table skeleton into `docs/game-suggestions-spike.md` (created in this
  phase, finished in Phase 3).

## Phase 2: Live prototype

- [ ] Add key placeholders to `.env.example` (`RAWG_API_KEY`, `IGDB_TWITCH_CLIENT_ID`,
  `IGDB_TWITCH_CLIENT_SECRET`) with a comment pointing at the spike doc.
- [ ] Write `scripts/spike-suggestions.ts` (run via `pnpm tsx scripts/spike-suggestions.ts`),
  following the `src/cli/sync.ts` CLI conventions (`parseArgs`, `process.loadEnvFile`,
  `requireToken`-style error messages). Pipeline:
  - [ ] Load `data/dad/latest.json` + `data/braidan/latest.json`; filter `playedTitles` to game
    categories (`ps4_game`, `ps5_native_game`, `ps4_ps2emu_game`); dedupe by `nameKey()`
    (`src/stats/names.ts`) with platform-suffix stripping (`(PlayStation®5)`, `PS4® & PS5®`, …).
  - [ ] Smoke-test both APIs (1 request each) to confirm the remote proxy allows
    `api.rawg.io`, `id.twitch.tv`, `api.igdb.com`; if blocked, stop and hand the script to the
    user to run locally.
  - [ ] Match each owned title against **both** RAWG and IGDB; record per-API match rate and
    per-title genres.
  - [ ] Build a genre profile per player and combined (weight by `playDurationMinutes`, not title
    count, so a 500 h RPG outweighs ten 1 h demos).
  - [ ] For the top ≥3 shared genres, fetch candidate games (RAWG: `/games?genres=…&platforms=…`
    ordered by rating; IGDB: genre query + `similar_games` from the most-played titles), filter
    out anything whose normalized name matches either player's library, and rank.
  - [ ] Emit a readable report: match rates, genre profiles, top ~10 suggestions per genre per
    API, unmatched-title list. `--json` flag for the raw dump used in the doc.
- [ ] Run against real snapshots; capture outputs for the doc (redact nothing — no secrets appear
  in output).

## Phase 3: Recommendation doc

- [ ] Write `docs/game-suggestions-spike.md`: chosen approach + explicit rationale (grounded in
  measured match rates and data quality from Phase 2), rough v2 data shape (e.g. a committed
  `data/suggestions.json` refreshed by a sync-time step vs. build-time fetch), cost/rate-limit/
  maintenance implications, licensing/attribution notes, and a scoped v2 issue list (fetch layer,
  storage/refresh cadence, stats function, UI surface, curated-overrides escape hatch).
- [ ] Sample prototype output embedded in the doc (small excerpt, not the full dump).
- [ ] Cross-link: doc references #9; `.env.example` comment references the doc.

## Pre-Commit Gate

Per `AGENTS.md` Commands (root package only — `site/` is untouched):

- [ ] `pnpm lint` ✅ (covers `scripts/` — extend `eslint.config.js` includes if needed)
- [ ] `pnpm typecheck` ✅ (extend `tsconfig.json` include to `scripts/` if needed)
- [ ] `pnpm test` ✅ (unchanged — no new tests; existing suite must stay green)
- [ ] `pnpm build` ✅ (tsup entry points unchanged — `scripts/` must not enter the build)

## Files Modified / Created

| File | Change |
|---|---|
| `docs/game-suggestions-spike.md` | **New** — the spike's recommendation (primary deliverable) |
| `scripts/spike-suggestions.ts` | **New** — committed prototype: snapshots → genre profile → suggestions via RAWG + IGDB |
| `.env.example` | Add commented `RAWG_API_KEY` / `IGDB_TWITCH_CLIENT_ID` / `IGDB_TWITCH_CLIENT_SECRET` placeholders |
| `eslint.config.js` / `tsconfig.json` | Only if needed to include `scripts/` in lint/typecheck |
