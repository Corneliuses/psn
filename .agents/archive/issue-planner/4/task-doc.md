# Task Doc — Phase 1: Site scaffold, routing, and splash page (#4)

## Prerequisites

- [ ] None — this issue is foundational (blocked by nothing per issue #4)

## Phase 1: Workspace & Data Fixtures

- [ ] Add `pnpm-workspace.yaml` at repo root listing `site` (and the root package) as workspace members
- [ ] Generate and commit `data/dad/latest.json` using `sampleSnapshot('dad', 'Dad')` from `src/fixtures/sample.ts`, serialized the same way `src/snapshot/store.ts` does (`JSON.stringify(snapshot, null, 2) + '\n'`)
- [ ] Generate and commit `data/braidan/latest.json` using `sampleSnapshot('braidan', 'Braidan')`, same serialization
- [ ] Note in the PR description that these are fixture snapshots pending real sync data from #8, not real PSN data

## Phase 2: Site Scaffold

- [ ] Scaffold `site/package.json` (name `site`, private, `workspace:*` dependency on the root `psn` package), `site/tsconfig.json` (mirror `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `resolveJsonModule` from root `tsconfig.json`, adjusted for a browser/DOM target), `site/vite.config.ts` (Vite + `@vitejs/plugin-react`)
- [ ] Add `react`, `react-dom`, `react-router` as `site/package.json` dependencies; `vite`, `@vitejs/plugin-react`, `typescript` as devDependencies
- [ ] Confirm `site/` can import `src/stats` and domain types from the root package's `src/index.ts` via the `workspace:*` dependency (a throwaway import is enough to prove resolution; remove before commit if unused)

## Phase 3: Config, Routing & Pages

- [ ] `site/src/config/players.ts` — typed re-export of `psn.config.json` player keys/`displayName` (import the JSON directly; do not duplicate the player list as a hardcoded array)
- [ ] `site/src/routes.ts` — build `/`, `/:playerKey` (or explicit `/dad`, `/braidan` generated from `players.ts`), `/compare` routes from `players.ts`, not hardcoded path strings
- [ ] `site/src/pages/SplashPage.tsx` — renders `site/src/components/PlaceholderGraphic.tsx` (inline SVG, commented as a placeholder to swap before launch) and three links built from `players.ts` (Dad's stats, Braidan's stats, Compare)
- [ ] `site/src/pages/PlayerPage.tsx` — single component parameterized by player key, renders a "Coming soon" placeholder naming the player's `displayName`
- [ ] `site/src/pages/ComparePage.tsx` — "Coming soon" placeholder
- [ ] `site/src/App.tsx` / `site/src/main.tsx` — wire up `react-router`'s `RouterProvider` using `routes.ts`
- [ ] Import `data/dad/latest.json` and `data/braidan/latest.json` somewhere reachable from the site build (even if not yet rendered) to prove the Vite JSON import path resolves and typechecks against `PlayerSnapshot`

## Phase 4: Testing

- [ ] Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` as `site` devDependencies; configure Vitest (in `site/vite.config.ts` or a separate `site/vitest.config.ts`) with `environment: 'jsdom'`
- [ ] Write `site/src/config/players.test.ts` — asserts player keys/labels come from `psn.config.json`
- [ ] Write `site/src/pages/SplashPage.test.tsx` — asserts 3 links render with correct hrefs
- [ ] Write `site/src/pages/PlayerPage.test.tsx` — asserts placeholder text includes `displayName` for both `dad` and `braidan`
- [ ] Write `site/src/routes.test.tsx` — renders `<App>` at each of `/`, `/dad`, `/braidan`, `/compare` and asserts no throw

## Phase 5: Scripts & CI

- [ ] Add `lint`, `typecheck`, `test`, `build` scripts to `site/package.json`, consistent with root script names
- [ ] Document `pnpm --filter site <script>` workspace commands in `AGENTS.md` (Commands table), rather than duplicating them as root-level scripts
- [ ] Extend `.github/workflows/ci.yml` with steps for `site`: `pnpm --filter site lint`, `pnpm --filter site typecheck`, `pnpm --filter site test`, `pnpm --filter site build` (after the existing root steps, or interleaved — keep root steps unchanged)

## Pre-Commit Gate

Per `AGENTS.md`: lint, typecheck, tests, and build must all pass before committing.

- [ ] `pnpm lint` (root) ✅
- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm typecheck` (root) ✅
- [ ] `pnpm --filter site typecheck` ✅
- [ ] `pnpm test` (root) ✅
- [ ] `pnpm --filter site test` ✅
- [ ] `pnpm build` (root) ✅
- [ ] `pnpm --filter site build` ✅

## Files Modified / Created

| File | Change |
|---|---|
| `pnpm-workspace.yaml` | New — declares `site` as a workspace package |
| `data/dad/latest.json` | New — fixture `PlayerSnapshot` for Dad |
| `data/braidan/latest.json` | New — fixture `PlayerSnapshot` for Braidan |
| `site/package.json` | New — site package manifest, deps, scripts |
| `site/tsconfig.json` | New — strict TS config mirroring root conventions |
| `site/vite.config.ts` | New — Vite + React plugin config (and Vitest config if colocated) |
| `site/src/config/players.ts` | New — typed player config from `psn.config.json` |
| `site/src/routes.ts` | New — route definitions built from player config |
| `site/src/App.tsx` | New — router provider / route outlet |
| `site/src/main.tsx` | New — React entrypoint |
| `site/src/pages/SplashPage.tsx` | New — splash page with graphic + 3 links |
| `site/src/pages/PlayerPage.tsx` | New — placeholder player page |
| `site/src/pages/ComparePage.tsx` | New — placeholder comparison page |
| `site/src/components/PlaceholderGraphic.tsx` | New — inline SVG placeholder, commented |
| `site/src/config/players.test.ts` | New — config test |
| `site/src/pages/SplashPage.test.tsx` | New — splash page test |
| `site/src/pages/PlayerPage.test.tsx` | New — player page test |
| `site/src/routes.test.tsx` | New — routing smoke test |
| `AGENTS.md` | Modified — document `site` workspace commands |
| `.github/workflows/ci.yml` | Modified — add `site` lint/typecheck/test/build steps |
