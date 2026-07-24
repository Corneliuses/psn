# Task Doc — Phase 7: Game suggestions for titles we don't own (#38)

## Prerequisites

- [ ] Create a `RAWG_API_KEY` GitHub Actions **repo secret** (rawg.io/apidocs). Out-of-band, done
  by a maintainer; the workflow reference (Phase 2) can land before the secret exists — sync just
  skips suggestions until it's set.
- [ ] Add `RAWG_API_KEY=` to local `.env` for a real refresh (never committed).

## Phase 1: Data layer — fetch, stats, cache, overrides (no network in tests)

- [ ] Create `src/suggestions/types.ts`: `Suggestion`, `SuggestionsFile` (`by_genre`,
  `shared_genres`, `metadata`), `GenreCache`/`CacheEntry`, `Overrides`.
- [ ] Create `src/suggestions/stats.ts` (pure): `cleanTitleName`, `collectLibrary(snapshots)`,
  `buildGenreProfile`, `topGenresPerPlayer(profile, n=3)`, `sharedGenres(profile)` — ported/adapted
  from `scripts/spike-suggestions.ts`. No I/O.
- [ ] Create `src/suggestions/fetch.ts`: `matchOwnedTitles(library, { fetch, key, delayMs=120 })`
  and `fetchSuggestionsForGenres(genreSlugs, topGenres, ownedKeys, { fetch, key, delayMs=120 })`;
  `rawgFetch` helper throws `RAWG <path> failed: HTTP <status>` (no key in message). Inject `fetch`
  + `delayMs` for testability.
- [ ] Create `src/suggestions/cache.ts`: `loadCache(path)` / `saveCache(path, cache)`;
  `missingTitles(library, cache)` so only cache-miss titles are fetched.
- [ ] Create `src/suggestions/overrides.ts`: `loadOverrides(path)` (missing/malformed → empty +
  warn); `applyOverrides(byGenre, overrides)` (hide by rawgId/name, add entries).
- [ ] Create `src/suggestions/store.ts`: `writeSuggestionsAtomic(path, file)` — write temp +
  `renameSync`; stable key order, sorted arrays, 2-space indent, trailing newline.
- [ ] Create `src/suggestions/index.ts`: barrel exporting types + `buildSuggestionsFile` selector
  for `site/` consumption.
- [ ] Add `sampleSuggestions()` to `src/fixtures/sample.ts`.
- [ ] Add `"./suggestions": "./src/suggestions/index.ts"` to `package.json` `exports`.
- [ ] Write unit tests `test/suggestions-fetch.test.ts` (mocked RAWG, `delayMs=0`) and
  `test/suggestions-stats.test.ts` (fixtures incl. empty + tie cases).

## Phase 2: Sync CLI integration + CI wiring

- [ ] Create `src/suggestions/sync.ts`: `syncSuggestions({ dataDir, config, fetch, key, dryRun })`
  — read `data/*/latest.json`, `collectLibrary`, load cache, fetch missing genres, build profiles,
  fetch per-genre suggestions, apply overrides, `writeSuggestionsAtomic`, `saveCache`. Returns a
  summary. Skips (warn) when `dryRun` or `key` absent.
- [ ] Wire into `src/cli/sync.ts`: add `suggestions: { type: 'boolean', default: true }` to
  `parseArgs`; after the player loop, if `values.suggestions && !dryRun`, read
  `process.env.RAWG_API_KEY` and call `syncSuggestions` (warn+skip when unset); log a one-line
  summary. `--no-suggestions` opts out.
- [ ] Update `.github/workflows/sync.yml`: add `RAWG_API_KEY: ${{ secrets.RAWG_API_KEY }}` to the
  "Sync PSN snapshots" step `env`. (The existing `git add data/` commit step already picks up
  `data/suggestions.json` + `data/suggestions-cache.json` — no change needed there.)
- [ ] Add `data/suggestions-overrides.json` to `.gitignore`.
- [ ] Update `.env.example` (if present) + `README.md`: `RAWG_API_KEY`, `--no-suggestions`, overrides.
- [ ] Write integration test `test/suggestions-sync.test.ts`: injected fetch + temp dir + sample
  snapshots → assert `suggestions.json` shape, atomicity (no `.tmp` left), overrides applied, cache
  written.

## Phase 3: Discover UI (new route)

- [ ] Commit an initial `data/suggestions.json` (from a real sync, or seeded via
  `sampleSuggestions()`) so the `site` static import resolves at build time.
- [ ] Add `suggestionsData()` to `site/src/data.ts` (static import of `../../data/suggestions.json`,
  typed via `psn/suggestions`).
- [ ] Add `DISCOVER_PATH = '/discover'` to `site/src/routes.ts`.
- [ ] Create `site/src/components/Suggestions.tsx`: composes `GlassCard` + `SectionHeader`; one
  group per shared genre (5–10 items), each an `<a href="https://rawg.io/games/{rawgId}">`;
  attribution footer "Data from [RAWG](https://rawg.io)". Compose motion presets; static under
  reduced motion.
- [ ] Create `site/src/pages/DiscoverPage.tsx`: loads `suggestionsData()`, renders `Suggestions`,
  styled empty state when unsynced (mirror `ComparePage` `EmptyState`).
- [ ] Wire route in `site/src/App.tsx` (`<Route path={DISCOVER_PATH} element={<DiscoverPage />} />`)
  and add a nav link in `site/src/components/AppShell.tsx` `navItems`.
- [ ] Write `site/src/components/Suggestions.test.tsx` and `site/src/pages/DiscoverPage.test.tsx`
  (roles/names, `listitem` count, RAWG hrefs, attribution link, empty state).
- [ ] Update `site/src/routes.test.tsx` / `AppShell.test.tsx` expectations for the new nav entry.

## Pre-Commit Gate

Run and confirm green before each phase's commit — **root and `site/`** (per AGENTS.md):

- [ ] `pnpm lint` ✅ &nbsp; `pnpm typecheck` ✅ &nbsp; `pnpm test` ✅ &nbsp; `pnpm build` ✅
- [ ] `pnpm sync --dry-run` ✅ (must not hit network / must skip suggestions)
- [ ] `pnpm --filter site lint` ✅ &nbsp; `typecheck` ✅ &nbsp; `test` ✅ &nbsp; `build` ✅
- [ ] `pnpm --filter site test:e2e` ✅ (Phase 3 — production-bundle smoke)

## Files Modified / Created

| File | Change |
|---|---|
| `src/suggestions/types.ts` | New — shared types |
| `src/suggestions/stats.ts` | New — pure genre-profile math |
| `src/suggestions/fetch.ts` | New — RAWG client (injectable fetch/delay) |
| `src/suggestions/cache.ts` | New — persisted title→genre cache |
| `src/suggestions/overrides.ts` | New — curated overrides load/apply |
| `src/suggestions/store.ts` | New — atomic write |
| `src/suggestions/sync.ts` | New — sync-time orchestration |
| `src/suggestions/index.ts` | New — barrel for site consumption |
| `src/fixtures/sample.ts` | Add `sampleSuggestions()` |
| `src/cli/sync.ts` | Add `--suggestions`/`--no-suggestions`; call `syncSuggestions` |
| `package.json` | Add `./suggestions` export |
| `.github/workflows/sync.yml` | Add `RAWG_API_KEY` to sync step env |
| `.gitignore` | Ignore `data/suggestions-overrides.json` |
| `.env.example` / `README.md` | Document `RAWG_API_KEY`, `--no-suggestions`, overrides |
| `data/suggestions.json` | New — committed initial suggestions file |
| `data/suggestions-cache.json` | New — committed genre cache |
| `site/src/data.ts` | Add `suggestionsData()` |
| `site/src/routes.ts` | Add `DISCOVER_PATH` |
| `site/src/components/Suggestions.tsx` | New — Discover component |
| `site/src/pages/DiscoverPage.tsx` | New — Discover page |
| `site/src/App.tsx` | Add `/discover` route |
| `site/src/components/AppShell.tsx` | Add Discover nav link |
| `test/suggestions-*.test.ts` | New — fetch/stats/sync tests |
| `site/src/.../Suggestions.test.tsx`, `DiscoverPage.test.tsx` | New — UI tests |
