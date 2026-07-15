# Design Doc — Phase 1: Site scaffold, routing, and splash page (#4)

## Overview

Stand up the site as a Vite + React + TypeScript static app in a new `site/` workspace package, wired into a pnpm workspace alongside the existing data-layer library. Add routing and a splash page that links to each player's stats and the comparison view. This is the foundation every other v1-site issue (#5, #6, #7) builds on.

## Acceptance Criteria

- [ ] Root `package.json` converted to a pnpm workspace root via `pnpm-workspace.yaml` listing `site`; existing root package continues to work unmodified as the data-layer lib
- [ ] `site/` scaffolded with Vite + React + TypeScript (`site/package.json`, `site/tsconfig.json`, `site/vite.config.ts`), mirroring strict-TS conventions from the root `tsconfig.json` (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`)
- [ ] `site/` depends on the root package via `workspace:*` and imports `src/stats` + domain types from `src/index.ts` — never `src/psn/`
- [ ] Placeholder snapshot fixtures committed at `data/dad/latest.json` and `data/braidan/latest.json` (fixture-shaped, not real PSN data) so `site/` can import `data/<player>/latest.json` directly via Vite JSON imports without a build failure; clearly flagged as fixture data pending real sync (#8)
- [ ] react-router wired with routes `/`, `/dad`, `/braidan`, `/compare`; route paths and labels are generated from `psn.config.json` player keys/`displayName`, never hardcoded
- [ ] Splash page (`/`) renders a placeholder father/son graphic (simple inline SVG, clearly commented as a placeholder) and three links: Dad's stats, Braidan's stats, Compare
- [ ] `/dad`, `/braidan`, `/compare` render minimal "Coming soon" placeholder pages naming the relevant player(s) — full implementations land in #5 and #6
- [ ] `site` gets its own lint/test/build scripts, invocable as `pnpm --filter site <script>` from the root, and documented in `AGENTS.md`
- [ ] Vitest + React Testing Library configured for `site`, with smoke tests covering the splash page and each route rendering without error
- [ ] `.github/workflows/ci.yml` extended to install, lint, typecheck, test, and build the `site` package in addition to the existing root steps

## Architecture & Data Model

### Data Layer

No changes to `src/`. Two new fixture files are added under `data/`:
- `data/dad/latest.json`
- `data/braidan/latest.json`

Both conform to `PlayerSnapshot` (`src/psn/models.ts`) and are generated via the existing `sampleSnapshot()` fixture helper (`src/fixtures/sample.ts`) to guarantee shape correctness. These are explicitly fixture/placeholder data, not real synced snapshots — `data/` currently only contains `.gitkeep`, and real data lands via the separate auto-sync issue (#8). A code comment at the top of each file (JSON can't hold comments, so this goes in a co-located note or the import site) and the PR description will flag this clearly, matching the pattern already used for the splash graphic placeholder.

### API / Service Layer

No new backend endpoints — this is a static site. The only "service layer" is direct data import:

| Endpoint / Function | Type | Auth | Purpose |
|---|---|---|---|
| `import data/dad/latest.json` | Vite JSON import | N/A (static) | Loads Dad's `PlayerSnapshot` at build time |
| `import data/braidan/latest.json` | Vite JSON import | N/A (static) | Loads Braidan's `PlayerSnapshot` at build time |
| `import { comparePlayers, recentGames, ... } from 'psn'` | workspace package import | N/A | Pure stat functions consumed by later pages (#5, #6); this issue only needs to prove the import path resolves |

### UI Component Tree

```
site/src/
├── main.tsx                 # React root, router provider
├── App.tsx                  # <RouterProvider> / route outlet
├── routes.ts                # Route definitions built from psn.config.json player keys
├── config/
│   └── players.ts           # Re-exports psn.config.json player keys/displayNames, typed
├── pages/
│   ├── SplashPage.tsx        # "/" — graphic + 3 links
│   ├── PlayerPage.tsx        # "/dad", "/braidan" — placeholder, takes playerKey param/prop
│   └── ComparePage.tsx       # "/compare" — placeholder
├── components/
│   └── PlaceholderGraphic.tsx  # inline SVG, commented as placeholder
└── vite-env.d.ts
```

`PlayerPage` is a single component parameterized by player key (via route param or route-level prop), not two near-duplicate components — this keeps #5 from having to restructure routing when it adds real content.

## Key Decisions

### Decision 1: Route content in this issue is placeholder-only

**Options considered:**
- Option A: Minimal "Coming soon" placeholder pages for `/dad`, `/braidan`, `/compare`
- Option B: Empty stub components with no visible content
- Option C: Build full page shells wired to real stats data now

**Decision:** Option A.
**Rationale:** User-selected. Keeps this issue's scope to scaffolding + routing + splash, which matches the issue's stated dependency graph (this issue blocks #5/#6, which own the real page content). Placeholder pages still prove routing, config-driven paths, and layout work end-to-end, unlike bare stubs.

### Decision 2: Splash graphic is an inline SVG placeholder

**Options considered:**
- Option A: Simple locally-authored SVG/CSS illustration
- Option B: Static placeholder image file (e.g. solid color / generic icon)
- Option C: Text-only, no image slot

**Decision:** Option A.
**Rationale:** User-selected. An inline SVG needs no binary asset pipeline, is trivially replaceable by swapping the component body, and can be clearly commented as a placeholder in the source — satisfying the issue's explicit "flag clearly as a placeholder" requirement.

### Decision 3: Test framework setup happens now, with smoke tests

**Options considered:**
- Option A: Set up Vitest + React Testing Library and write smoke tests in this issue
- Option B: Wire up the test script but defer writing tests
- Option C: Defer test framework entirely

**Decision:** Option A.
**Rationale:** User-selected. The issue explicitly calls out "site's own test command once added" and lists `pnpm test` as a relevant command; standing up the runner without any tests would leave CI's `site` test step meaningless. Smoke tests (splash renders, each route renders without throwing) are cheap and catch config-driven routing regressions early — the exact kind of bug this scaffold is prone to.

### Decision 4: CI runs lint + typecheck + test + build for `site`

**Options considered:**
- Option A: Mirror the root pattern fully (lint, typecheck, test, build)
- Option B: Build only, defer lint/test wiring

**Decision:** Option A.
**Rationale:** User-selected, and consistent with the existing root CI steps in `.github/workflows/ci.yml` (`pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`). Since this issue also sets up lint and test for `site`, wiring all four into CI now avoids a follow-up CI change.

### Decision 5: Commit fixture snapshot data now, not defer the JSON import

**Options considered:**
- Option A: Commit `data/dad/latest.json` and `data/braidan/latest.json` as fixture data now
- Option B: Skip the JSON-import task in this issue since placeholder pages don't need real data

**Decision:** Option A.
**Rationale:** User-selected. The issue explicitly lists "load committed snapshots into the site" as a task, and proving the Vite JSON import path resolves and typechecks against `PlayerSnapshot` now — rather than deferring it to #5/#6 — catches integration issues (module resolution, `resolveJsonModule`-equivalent Vite config, type shape drift) at the cheapest point. Fixture data reuses the existing `sampleSnapshot()` helper so there's no new fixture-authoring logic, and the fixtures are clearly documented as placeholders pending #8.

## Security & Permissions

No auth, no roles — this is a fully public static site with no backend. No PSN credentials, tokens, or `src/psn/` imports are ever reachable from `site/`; this is enforced by convention (documented in `AGENTS.md` and this design doc) rather than a lint rule, since no automated boundary check currently exists in the repo. Flagging a possible lint-boundary follow-up (e.g. `eslint-plugin-boundaries` or a path restriction) as an out-of-scope idea, not a blocker for this issue.

## Error Handling

- If a route param doesn't match a configured player key, `PlayerPage` renders a "player not found" state rather than throwing — defensive, since this is a static site with no server-side 404 handling beyond the SPA's own routing.
- Vite JSON imports fail at build time (not runtime) if a file is missing — this is why fixture data must be committed as part of this issue rather than left absent.
- No network calls exist in `site/` at this stage, so there is no async error/loading state to design yet; that arrives with #5/#6 when real stat computations are wired to UI.

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Routing | Smoke/unit | `site/src/routes.test.tsx` | Renders `<App>` at each configured path (`/`, `/dad`, `/braidan`, `/compare`), asserts no throw and expected heading text |
| SplashPage | Unit | `site/src/pages/SplashPage.test.tsx` | Asserts 3 links present, hrefs match `psn.config.json` player keys + `/compare` |
| PlayerPage | Unit | `site/src/pages/PlayerPage.test.tsx` | Asserts placeholder text includes the player's `displayName` for both `dad` and `braidan` |
| Config | Unit | `site/src/config/players.test.ts` | Asserts player keys/labels are read from `psn.config.json`, not hardcoded (e.g. fails if a key is renamed in fixture config) |

Root `pnpm test` continues to run only `test/` (the data-layer lib); `site` gets its own Vitest config/script, run separately as `pnpm --filter site test` and as a distinct CI step — matching the issue's "root plus site's own test command" framing.

## Config Changes

- [ ] `pnpm-workspace.yaml` — new file at repo root, `packages: ['site']` (or `packages: ['.', 'site']` per pnpm workspace conventions — root package stays a workspace member)
- [ ] `site/package.json`, `site/tsconfig.json`, `site/vite.config.ts`, `site/vitest.config.ts` (or Vitest config merged into `vite.config.ts`) — new
- [ ] Root `package.json` — add `site:*` convenience scripts or document `pnpm --filter site <script>` in `AGENTS.md` (per issue, either is acceptable; recommend documenting in `AGENTS.md` to avoid script duplication)
- [ ] `.github/workflows/ci.yml` — add `site` install/lint/typecheck/test/build steps
- [ ] `data/dad/latest.json`, `data/braidan/latest.json` — new fixture snapshot files
- [ ] No environment variables — static site, no secrets
- [ ] New dependencies: `react`, `react-dom`, `react-router` (site), `vite`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` (site devDependencies)

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| `data/<player>/latest.json` missing at build time | High — Vite build fails | Commit fixture snapshots as part of this issue (Decision 5) |
| Fixture snapshot data mistaken for real synced data later | Medium — confusing history once #8 lands | Comment/flag fixtures clearly (source note + PR description); #8's implementation should overwrite these files, not append |
| Player key hardcoded somewhere despite the "no hardcoding" rule | Medium — silent drift if `psn.config.json` changes | Centralize config reads in `site/src/config/players.ts`; cover with a test asserting no other file imports `psn.config.json` directly (or rely on code review) |
| `noUncheckedIndexedAccess`/strict TS in `site/tsconfig.json` diverges from root | Low — inconsistent type safety across packages | Copy compiler options from root `tsconfig.json`, adjust only `lib`/`jsx`/`module` for a browser target |
| CI time increase from adding a second package's full pipeline | Low | Steps run sequentially like the existing job; acceptable for this repo's size, no action needed now |
