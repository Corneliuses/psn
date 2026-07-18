# Task Doc — Add browser-level test coverage for the site (#14)

## Prerequisites

- [ ] None blocking. (`#8` real-snapshot sync is *not* a blocker — the `image.example` 404
  allowlist lets this land against current fixtures; revisit the allowlist once #8 lands.)

## Phase 1: Test harness — dependency & Playwright config

- [ ] Add `@playwright/test` to `devDependencies` in `site/package.json`.
- [ ] Add a `test:e2e` script to `site/package.json`: `"test:e2e": "playwright test"`.
- [ ] Run `pnpm install` from the repo root so `pnpm-lock.yaml` re-resolves with the new dep.
- [ ] Create `site/playwright.config.ts`:
  - `testDir: 'e2e'`, Chromium project only, `reporter: 'list'`.
  - `webServer`: command `pnpm build && pnpm preview --port <PORT>`, `url` matching the
    preview server, `reuseExistingServer: !process.env.CI`, generous `timeout` for the build.
  - `use.baseURL` set to the preview URL so specs can navigate with relative paths.
- [ ] Ensure the local Chromium is found (dev container sets `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`);
  do **not** add a `playwright install` step to any local script.

## Phase 2: Config isolation — keep Vitest and tsc off the e2e specs

- [ ] In `site/vite.config.ts`, add `test.exclude` (preserving Vitest defaults) so
  `e2e/**` is not collected by the jsdom `vitest run`.
- [ ] In `site/tsconfig.json` (and/or eslint scope), ensure `e2e/**` typechecks against
  Playwright types without colliding with the app's `tsc --noEmit` project — either add a
  dedicated `tsconfig` include for `e2e/` or exclude it from the app project. Confirm
  `pnpm --filter site typecheck` and `pnpm --filter site lint` stay green.

## Phase 3: The smoke spec

- [ ] Create `site/e2e/smoke.spec.ts`:
  - [ ] A helper that attaches `page.on('console', …)` (error level) and
    `page.on('pageerror', …)` listeners, collecting any message whose URL/text is **not**
    matched by `https://image.example/`.
  - [ ] Parameterize over `['dad', 'braidan']` (import player keys from
    `site/src/config/players.ts` / `psn.config.json` rather than hardcoding, per the
    "never hardcode player keys" rule).
  - [ ] For each key: `await page.goto('/' + key)`; assert the four `h2` headings
    (`Recent games`, `Most played`, `Most trophies`, `Platinum games`) are visible via
    `getByRole('heading', { level: 2, name })`.
  - [ ] Assert at least one computed metric is visible (e.g. a duration like `/\d+h \d+m/`
    or a trophy count like `/\d+ trophies/`), mirroring `PlayerPage.test.tsx`.
  - [ ] After navigation settles, assert the collected non-allowlisted error list is empty.

## Phase 4: CI wiring

- [ ] Add a `site-e2e` job to `.github/workflows/ci.yml`, parallel to `verify`:
  - [ ] `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` (node 22, pnpm cache).
  - [ ] `pnpm install --frozen-lockfile`.
  - [ ] `pnpm --filter site exec playwright install --with-deps chromium`.
  - [ ] `pnpm --filter site test:e2e`.
- [ ] Confirm the `verify` job is unchanged (the e2e suite is additive, not moved into it).

## Phase 5: Docs

- [ ] In `AGENTS.md` → `### site/ workspace commands` table, add a row:
  `| Browser smoke test (E2E) | `pnpm --filter site test:e2e` |`.
- [ ] If the `## Commands`/gate wording implies the full pre-commit gate, note that the e2e
  suite requires a provisioned Chromium and is run in its own CI job.

## Pre-Commit Gate

Verification commands from `AGENTS.md` → `## Commands` / `site/` workspace commands. Run and
confirm green before committing:

- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm --filter site typecheck` ✅
- [ ] `pnpm --filter site test` ✅ (jsdom units — must not pick up `e2e/`)
- [ ] `pnpm --filter site build` ✅
- [ ] `pnpm --filter site test:e2e` ✅ (new browser suite, against the built site)
- [ ] Root gate unaffected: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` ✅

## Files Modified / Created

| File | Change |
|---|---|
| `site/package.json` | Add `@playwright/test` devDep + `test:e2e` script |
| `site/playwright.config.ts` | **New** — `webServer` builds+previews, Chromium project, `testDir: 'e2e'` |
| `site/e2e/smoke.spec.ts` | **New** — `/dad` & `/braidan` smoke: headings + metric + no-unexpected-errors |
| `site/vite.config.ts` | Exclude `e2e/**` from Vitest `test.include` |
| `site/tsconfig.json` (or e2e tsconfig) | Scope e2e specs to Playwright types without breaking `tsc` |
| `pnpm-lock.yaml` | Re-resolved with `@playwright/test` |
| `.github/workflows/ci.yml` | New `site-e2e` job provisioning Chromium + running the suite |
| `AGENTS.md` | Document `pnpm --filter site test:e2e` in the site commands table |
