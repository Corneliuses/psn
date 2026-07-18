# Proposal — Add browser-level test coverage for the site (#14)

## Executive Summary

The `site/` package is tested only under Vitest + jsdom, which runs no real renderer, no real
client-side navigation, and — critically — never exercises the production `vite build` bundle.
That gap is not hypothetical: in #5 a `psn` barrel re-export transitively pulled in the
Node-only `src/snapshot/store.ts` (`node:fs`/`node:path`), which broke `vite build` while every
jsdom test stayed green.

This proposal adds a durable, CI-run browser smoke test using **`@playwright/test`**, run
against the **built** site served by `vite preview`. Loading the real production bundle in
headless Chromium and asserting the per-player page renders is what catches the build-only
class of regression — so the approach is deliberately Playwright-against-preview rather than
Vitest browser mode (which only exercises Vite's dev-server transform and would not reproduce a
`vite build` failure). The suite is additive: the fast jsdom units remain the inner loop.

## Scope

### In Scope
- `@playwright/test` dev dependency + `site/playwright.config.ts` (builds & previews the site).
- `site/e2e/smoke.spec.ts`: visits `/dad` and `/braidan` against the production build, asserts
  the four section headings and at least one computed metric, and asserts no unexpected
  console/page errors (tolerating the known `https://image.example/` placeholder 404s).
- Config isolation so Vitest and `tsc` do not pick up the e2e specs.
- A dedicated `site-e2e` CI job that provisions Chromium and runs the suite.
- Documenting `pnpm --filter site test:e2e` in `AGENTS.md`.

### Out of Scope
- Replacing the placeholder fixture images / real snapshot sync (#8) — this suite tolerates
  the placeholder 404s and does not depend on #8.
- Broader E2E coverage (Splash, Compare, NotFound, navigation flows, visual regression) — this
  ticket is a targeted smoke test; wider coverage can be a follow-up if desired.
- Migrating the existing jsdom unit suite; it is unchanged.

## Acceptance Criteria

1. A browser test tool + config is added to `site/` as a dev dependency (not the root package).
2. A smoke spec visits `/dad` and `/braidan` against the production build (`vite build` +
   `vite preview`) and asserts, for each, the four section headings (`Recent games`,
   `Most played`, `Most trophies`, `Platinum games`) plus at least one computed metric.
3. The spec asserts no unexpected console errors or uncaught page errors, tolerating only the
   `https://image.example/` placeholder image 404s.
4. The suite runs against the real production bundle, so a build-only break (e.g. a Node-only
   transitive import) fails it.
5. CI provisions Chromium and runs the suite in a dedicated job.
6. `pnpm --filter site test:e2e` is documented in `AGENTS.md` → site workspace commands.
7. The existing `site` gate (lint, typecheck, jsdom tests, build) stays green and is unaffected.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Test harness: `@playwright/test` dep + `playwright.config.ts` (build+preview webServer) | `site/package.json`, `site/playwright.config.ts`, `pnpm-lock.yaml` |
| 2 | Config isolation so Vitest/`tsc` skip `e2e/` | `site/vite.config.ts`, `site/tsconfig.json` |
| 3 | Smoke spec: `/dad` & `/braidan` headings + metric + no-unexpected-errors | `site/e2e/smoke.spec.ts` |
| 4 | CI: dedicated `site-e2e` job provisioning Chromium | `.github/workflows/ci.yml` |
| 5 | Docs | `AGENTS.md` |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Placeholder `image.example` 404s trip the "no errors" assertion | Med | Explicitly allowlist that host; revisit when #8 lands |
| Chromium not provisioned in CI | Med | Dedicated job runs `playwright install --with-deps chromium` first |
| E2E specs cross-collected by Vitest / break `tsc` | Med | Keep in `e2e/`, excluded from Vitest include & app tsconfig; Playwright `testDir: 'e2e'` |
| CI runtime increase | Low | Separate job runs parallel to `verify`; Chromium-only provisioning |
| Animation/count-up flake | Low | Assert stable final text/roles only |

## Effort Estimate

**Overall:** Small (1–2 days) — mostly test-harness plumbing and CI wiring; no product code
changes and one focused spec.

| Phase | Estimate |
|---|---|
| Phase 1 (harness/dep/config) | ~0.5 day |
| Phase 2 (isolation) | ~0.25 day |
| Phase 3 (smoke spec) | ~0.25 day |
| Phase 4 (CI) | ~0.25 day (includes a CI round-trip to confirm Chromium provisioning) |
| Phase 5 (docs) | ~0.1 day |

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement phase by phase.
3. After implementation is merged, delete `.agents/issue-planner/14/` and close the issue.
