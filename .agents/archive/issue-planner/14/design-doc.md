# Design Doc — Add browser-level test coverage for the site (#14)

## Overview

The `site/` package is covered only by Vitest + jsdom, which runs no real renderer, no
real client-side navigation, and never exercises the production `vite build` bundle. This
adds a durable, CI-run browser smoke test — a `@playwright/test` suite that loads the
**built** site in real headless Chromium — so routing, the committed `data/*/latest.json`
imports, and the production bundle are all exercised, closing the gap that let the #5
`node:fs` barrel-import regression pass every jsdom test while breaking `vite build`.

## Acceptance Criteria

- [ ] A browser test tool + config is added to `site/` (dev dependency, not root).
- [ ] A smoke spec visits `/dad` **and** `/braidan` against the production build served by
  `vite preview`, asserting for each: the four section headings render (`Recent games`,
  `Most played`, `Most trophies`, `Platinum games`) and at least one computed metric appears.
- [ ] The spec asserts there are **no unexpected** console errors or uncaught page errors,
  tolerating only the known `https://image.example/…` placeholder image 404s.
- [ ] The suite runs against the real `vite build` output (production bundle), so a
  build-only break (e.g. a Node-only transitive import) fails the test — this is the core
  motivation and distinguishes it from the existing jsdom tests.
- [ ] CI provisions a browser and runs the suite (a dedicated job).
- [ ] The command is documented in `AGENTS.md` → `site/` workspace commands.
- [ ] The `site` gate (lint, typecheck, existing Vitest, build) stays green.

## Architecture & Data Model

### Data Layer

No data-model changes. The test consumes the already-committed fixture snapshots
(`data/dad/latest.json`, `data/braidan/latest.json`) exactly as the built site imports them.
No new snapshots, schema, or migration.

### API / Service Layer

N/A — no backend, endpoints, or service functions. This is a test-infrastructure-only change.

### Component / Route surface under test

The suite is black-box against the built app; it renders the real route tree from
`site/src/App.tsx` served as static `dist/`:

| Route | Page | Smoke assertions |
|---|---|---|
| `/dad` | `PlayerPage` (`playerKey="dad"`) | four `h2` section headings + ≥1 computed metric |
| `/braidan` | `PlayerPage` (`playerKey="braidan"`) | four `h2` section headings + ≥1 computed metric |

Section headings are level-2 headings emitted by `SectionHeader` (`site/src/components/SectionHeader.tsx`):
`Recent games`, `Most played`, `Most trophies`, `Platinum games`. A "computed metric" is a
`src/stats`-derived string such as a `formatMinutes` duration (e.g. `210h 4m`) or a trophy
count (e.g. `66 trophies`), matching what `PlayerPage.test.tsx` already asserts under jsdom.

## Key Decisions

### Decision 1: `@playwright/test` vs. Vitest browser mode

**Options considered:**
- Option A — Standalone `@playwright/test` suite under `site/e2e/`, run against `vite build`
  + `vite preview`.
- Option B — Vitest browser mode (`@vitest/browser-playwright`), reusing the existing Vitest
  config (the issue's suggested "lowest friction" option).

**Decision:** Option A.
**Rationale:** The ticket exists specifically to catch build-only regressions — the #5
`node:fs` barrel import broke `vite build` while every jsdom test stayed green. Vitest browser
mode serves modules through Vite's **dev-server** transform pipeline, which does not reproduce
a production `vite build` failure, so it would not catch the exact class of bug cited.
`@playwright/test` pointed at `vite preview` serves the real `dist/`, so a broken production
build fails the suite directly — satisfying the core AC. The isolation also keeps browser
provisioning out of the fast jsdom unit path. Confirmed with the issue author during grooming.

### Decision 2: Correcting the "already resolved in the lockfile" premise

**Finding:** `@vitest/browser-playwright` appears in `pnpm-lock.yaml` only as vitest's
peer-dependency **declaration** (lines ~2145 and ~2161); neither it nor `playwright` /
`playwright-core` is an installed package, and CI provisions no browser today.
**Decision:** Treat a real dev dependency + browser-binary provisioning as required work
regardless of approach. Add `@playwright/test` to `site/devDependencies`, install the
Chromium binary in CI (`playwright install --with-deps chromium`), and let pnpm re-resolve
the lockfile. The pre-installed Chromium in the local dev container
(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) is used locally; CI provisions its own.

### Decision 3: How the "no unexpected errors" assertion is scoped

**Decision:** Collect `console` (error-level) messages and `pageerror` events during the
visit; fail if any occur **except** requests/messages whose URL matches
`https://image.example/`. Rationale: the placeholder fixture image URLs 404 until real
snapshots land in #8 (per the issue and `GameSection`'s neutral-tile fallback), so those are
expected; anything else (a real JS exception, a genuinely missing asset) is a signal we want.
Matching by the known host keeps the assertion strict without coupling to #8's timing.

## Security & Permissions

No auth, roles, or access-control surface. The site is a static public build; the test uses
committed fixture data only and requires no credentials or network beyond the local preview
server (the only external requests are the `image.example` placeholders, which are expected
to fail). No secrets are introduced.

## Error Handling

- **Preview server lifecycle:** Playwright's `webServer` config builds and serves the site
  (`vite build && vite preview`), waiting on the preview URL before tests run and tearing it
  down after; a failed build fails the run before any spec executes.
- **Expected vs. unexpected page errors:** handled by the `image.example` allowlist above.
- **Flake control:** assert on role/text that is stable under reduced motion (headings and
  final metric text render immediately; `AnimatedNumber` settles to its final value), so no
  reliance on animation timing.

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Built site (routing + bundle) | Browser E2E (Playwright) | `site/e2e/smoke.spec.ts` | Loads `/dad` & `/braidan` from `vite preview`; asserts four headings + a metric + no unexpected errors |
| Playwright config | Config | `site/playwright.config.ts` | `webServer` runs `vite build`+`vite preview`; Chromium project; test dir `e2e/` |
| Existing jsdom units | Unit (unchanged) | `site/src/**/*.test.tsx` | Remain the fast inner loop; browser suite is additive |

## Config Changes

- [ ] Schema / index changes — none required.
- [ ] Access rule changes — none required.
- [ ] Environment variables — none required (CI sets no new secrets; local uses the
  pre-provisioned `PLAYWRIGHT_BROWSERS_PATH`).
- [ ] Dependency changes — add `@playwright/test` to `site/devDependencies`; `pnpm-lock.yaml`
  re-resolves. New `site` script `test:e2e`. Exclude `site/e2e/` from the Vitest `test`
  include and from `tsc` project scope so the two runners don't collide.
- [ ] CI — new `site-e2e` job in `.github/workflows/ci.yml` that installs deps, provisions
  Chromium, then runs `pnpm --filter site test:e2e`.

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| `image.example` placeholder 404s trip the "no errors" assertion | Med | Allowlist that host explicitly (Decision 3); revisit when #8 lands real snapshots |
| Playwright's Chromium not installed in CI → suite errors, not fails-meaningfully | Med | Dedicated job runs `playwright install --with-deps chromium` before the suite |
| `site/e2e/*.spec.ts` picked up by Vitest (or vice-versa) causing double-run / type errors | Med | Keep specs in `e2e/`, excluded from Vitest `include` and `tsconfig`; Playwright `testDir: 'e2e'` |
| Browser job noticeably lengthens CI | Low | Separate job runs in parallel with `verify`; provisioning scoped to Chromium only |
| Animation/count-up timing flake | Low | Assert only stable final text/roles; no timing-dependent assertions |
| `vite preview` port collision / not-ready races | Low | Use Playwright `webServer.url` + `reuseExistingServer: !process.env.CI` so CI always builds fresh |
