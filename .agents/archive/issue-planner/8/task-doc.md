# Task Doc — Automated weekly snapshot sync via GitHub Actions (#8)

## Prerequisites

- [ ] None blocking. The sync CLI (`pnpm sync`) already exists and is tested (#2).
- [ ] (Maintainer, out-of-band) `NPSSO_DAD` and `NPSSO_BRAIDAN` added as repo secrets before the
  first real run — an agent cannot set these.

## Phase 1: Workflow

- [ ] Create `.github/workflows/sync.yml`:
  - [ ] `name: Weekly sync`
  - [ ] `on:` — `schedule: - cron: '0 8 * * 1'` (Mondays 08:00 UTC) **and** `workflow_dispatch:`
  - [ ] `permissions: contents: write` at the job (or top) level
  - [ ] Job `sync` on `ubuntu-latest`
  - [ ] Steps 1–3: `actions/checkout@v4`, `pnpm/action-setup@v4`,
    `actions/setup-node@v4` with `node-version: '22'` and `cache: pnpm` — copied verbatim from
    `.github/workflows/ci.yml` (AC5)
  - [ ] Step: `pnpm install --frozen-lockfile`
  - [ ] Step: `pnpm sync` with `env: NPSSO_DAD: ${{ secrets.NPSSO_DAD }}` and
    `NPSSO_BRAIDAN: ${{ secrets.NPSSO_BRAIDAN }}`
  - [ ] Step: commit & push — set `github-actions[bot]` identity, `git add data/`, and only
    commit/push when `git status --porcelain data/` is non-empty; message
    `chore(data): weekly PSN sync [skip ci]`
  - [ ] Comments in the file documenting: failure-notification-as-alerting choice (AC3),
    the cron time rationale, and the `[skip ci]` guard

## Phase 2: Documentation

- [ ] Update README `## Setup` (`README.md`): add a short "Automated sync" note listing the
  required repo secrets (`NPSSO_DAD`, `NPSSO_BRAIDAN`), where to add them (repo Settings →
  Secrets and variables → Actions), the weekly cadence, and that tokens expire ~2 months and
  need periodic manual refresh (cross-reference the existing NPSSO-token paragraph). (AC4)

## Pre-Commit Gate

Per `AGENTS.md` → `## Commands`. This change touches only `.github/` + `README.md` (no TS), so
the source-code gates are unaffected, but run them to confirm nothing regressed:

- [ ] `pnpm lint` ✅
- [ ] `pnpm typecheck` ✅
- [ ] `pnpm test` ✅
- [ ] `pnpm build` ✅
- [ ] `pnpm sync --dry-run` ✅ (confirms the invoked CLI still runs)
- [ ] YAML validity of `sync.yml` (e.g. parse-check) ✅

## Files Modified / Created

| File | Change |
|---|---|
| `.github/workflows/sync.yml` | **New** — weekly scheduled + manual sync workflow that commits `data/` changes to `main` |
| `README.md` | Setup section: document required repo secrets, location, cadence, and token expiry |
