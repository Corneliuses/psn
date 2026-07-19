# Design Doc — Automated weekly snapshot sync via GitHub Actions (#8)

## Overview

Manual `pnpm sync` is the only way `data/` gains history today. This adds a scheduled
GitHub Actions workflow that runs `pnpm sync` weekly with repo secrets and commits any
changed snapshots back to `main`, so history accumulates automatically. Regular history is
the precondition for #7's trend/analytics views becoming meaningful.

## Acceptance Criteria

- [ ] AC1: `.github/workflows/sync.yml` exists — weekly cron trigger, checks out the repo,
  sets up Node + pnpm mirroring `ci.yml` exactly (same actions, same versions), installs deps
  with `--frozen-lockfile`, and runs `pnpm sync` with `NPSSO_DAD` / `NPSSO_BRAIDAN` sourced
  from `secrets.*`.
- [ ] AC2: Changed files under `data/` are committed back to `main` with a bot identity and a
  clear message (`chore(data): weekly PSN sync`); the job no-ops cleanly (no empty commit,
  no failure) when nothing changed.
- [ ] AC3: The job fails loudly on sync failure (relies on `sync.ts`'s non-zero exit) rather
  than adding custom alerting; the workflow comments that GitHub's own failure notifications
  are the intended alert.
- [ ] AC4: README Setup documents the required repo secrets (`NPSSO_DAD`, `NPSSO_BRAIDAN`),
  where to add them (repo Settings → Secrets and variables → Actions), and that tokens expire
  ~2 months and need periodic manual refresh.
- [ ] AC5: The workflow YAML is valid and its Node/pnpm setup steps are byte-for-byte the same
  actions/versions as `ci.yml`'s.

## Architecture & Data Model

No code or data-model changes. This is pure CI configuration plus documentation. The workflow
is a thin wrapper around the existing, tested `pnpm sync` CLI (`src/cli/sync.ts`), which:

- reads `psn.config.json` for player→env-var mapping (`NPSSO_DAD`, `NPSSO_BRAIDAN`),
- authenticates and fetches per player, isolating failures (one player's auth error does not
  abort the other),
- writes `data/<player>/<YYYY-MM-DD>.json` and mirrors `data/<player>/latest.json`
  (`src/snapshot/store.ts`), and
- exits non-zero if any player failed.

### API / Service Layer

| Endpoint / Function | Type | Auth | Purpose |
|---|---|---|---|
| `pnpm sync` (`src/cli/sync.ts`) | CLI (invoked by workflow) | NPSSO tokens via env | Fetch + persist snapshots for all players |

Env var names are **not** hardcoded in the workflow beyond passing the two secrets into the
job env; the CLI resolves which var each player uses from `psn.config.json`.

### Workflow shape

```
sync.yml
├── on: schedule (weekly cron) + workflow_dispatch (manual runs / token-refresh testing)
├── permissions: contents: write        # required to push the data commit
├── job: sync (ubuntu-latest)
│   ├── checkout@v4                      # ─┐
│   ├── pnpm/action-setup@v4             #  │ identical to ci.yml
│   ├── setup-node@v4 (node 22, cache)   # ─┘
│   ├── pnpm install --frozen-lockfile
│   ├── pnpm sync   (env: NPSSO_* from secrets)
│   └── commit & push data/ if changed   # bot identity, no-op when clean
```

## Key Decisions

### Decision 1: Commit directly to `main` vs. open a PR

**Options considered:**
- Option A: Commit the snapshot changes straight to `main` from the workflow.
- Option B: Open a pull request with the changes for review before merge.

**Decision:** Option A — commit directly to `main`.
**Rationale:** The issue explicitly says "commit any changed files under `data/` back to
`main`". Snapshots are machine-generated, diff-friendly, low-sensitivity data; a human review
gate adds friction with no safety benefit. Requires `permissions: contents: write` on the job.

### Decision 2: Cron schedule

**Options considered:**
- Option A: `0 8 * * 1` — every Monday 08:00 UTC.
- Option B: Sunday night / other day.

**Decision:** `0 8 * * 1` (Mondays, 08:00 UTC).
**Rationale:** "Weekly" is the only constraint in the issue. Monday morning UTC captures the
full prior weekend's play — the highest-activity window for a father/son who game on weekends —
in the first snapshot of each week. The exact time is not load-bearing (snapshots are
at-most-daily); documented in a workflow comment so it's easy to change.

### Decision 3: Avoid burning CI on machine data commits

**Options considered:**
- Option A: Add `[skip ci]` to the bot commit message.
- Option B: Let the data commit trigger `ci.yml`'s `push: [main]` run.

**Decision:** Option A — include `[skip ci]` in the commit message.
**Rationale:** A weekly data-only commit re-running the full lint/type/test/build/e2e matrix
adds nothing (no source changed) and consumes CI minutes. `[skip ci]` is the standard,
low-risk guard. Documented in a workflow comment.

### Decision 4: Add `workflow_dispatch`

**Decision:** Include `workflow_dispatch` alongside the schedule.
**Rationale:** Lets a maintainer run the sync on demand — e.g. to verify secrets after a token
refresh — without waiting for the weekly window or editing the cron. Zero cost, no downside.

### Decision 5: No-op vs. empty commit when nothing changed

**Decision:** Guard the commit step with `git status --porcelain data/`; only `git commit` /
`git push` when that reports changes.
**Rationale:** AC2 requires clean no-op. `git commit` with no staged changes exits non-zero and
would fail the job spuriously; the porcelain check avoids empty commits and false failures.

## Security & Permissions

- Tokens (`NPSSO_DAD`, `NPSSO_BRAIDAN`) live only in GitHub Actions secrets, injected as job
  env vars — never printed (the CLI logs player display names and counts, not tokens) and never
  committed.
- The job requests the minimum extra scope needed: `permissions: contents: write` (default
  `GITHUB_TOKEN`, no PAT). All other permissions stay at their restricted defaults.
- Commits are attributed to the `github-actions[bot]` identity
  (`github-actions[bot]@users.noreply.github.com`), consistent with GitHub's convention for
  automated commits.
- Push uses the checkout-provided `GITHUB_TOKEN`; no additional credentials configured.

## Error Handling

- Per-player auth/fetch failures are already isolated and surfaced by `src/cli/sync.ts`
  (`PsnAuthError`, per-player `✗` log line) — the workflow adds nothing here.
- If any player fails, `sync.ts` exits non-zero → the workflow step fails → the run is marked
  failed → GitHub's built-in workflow-failure notification is the alert (AC3). No custom
  alerting is built.
- Because the commit step runs after `pnpm sync`, a hard sync failure short-circuits before any
  commit (default step ordering, no `if: always()`), so partial/failed runs never push data.

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Workflow YAML | Static validation | `.github/workflows/sync.yml` | YAML parses; steps mirror `ci.yml` |
| Sync CLI | Existing unit/dry-run | `test/`, `pnpm sync --dry-run` | Already covered by #2; unchanged here |

No new automated tests: this issue adds no product code, only CI config + docs. Verification is
(1) YAML validity, (2) a manual `workflow_dispatch` run once secrets are set, confirming a data
commit appears (or a clean no-op / a loud failure on a bad token).

## Config Changes

- [ ] Schema / index changes — none required.
- [ ] Access rule changes — workflow-level `permissions: contents: write` (new file only).
- [ ] Environment variables — no new source env vars; `NPSSO_DAD` / `NPSSO_BRAIDAN` must be
  added as **repo secrets** by the maintainer (documented, not automatable).
- [ ] Dependency changes — none required.

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| No snapshot changed this week | Low | `git status --porcelain data/` guard → clean no-op, no empty commit |
| One player's token expired | Med | `sync.ts` isolates the failure; other player still syncs, but job exits non-zero so the failure is visible (AC3). README notes ~2-month expiry + refresh |
| Both tokens expired | Med | Job fails loudly → GitHub notification prompts a manual token refresh |
| Bot commit triggers CI on main | Low | `[skip ci]` in commit message |
| Node/pnpm setup drifts from `ci.yml` | Low | Copy `ci.yml`'s three setup steps verbatim; AC5 checks parity |
| Concurrent scheduled + manual run racing the push | Low | Weekly cadence makes overlap unlikely; acceptable for now (could add `concurrency:` later if it becomes an issue) |
