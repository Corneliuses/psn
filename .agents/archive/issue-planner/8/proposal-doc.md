# Proposal — Automated weekly snapshot sync via GitHub Actions (#8)

## Executive Summary

Snapshot history in `data/` currently grows only when someone runs `pnpm sync` by hand. This
proposal adds a scheduled GitHub Actions workflow (`.github/workflows/sync.yml`) that runs
`pnpm sync` once a week using repo secrets and commits any changed snapshots straight to `main`
with a bot identity. History then accumulates on its own — the precondition for #7's
trend/analytics views to become meaningful over time.

The change is deliberately thin: the workflow wraps the existing, tested sync CLI rather than
adding logic. It mirrors `ci.yml`'s Node/pnpm setup verbatim to avoid drift, relies on
`sync.ts`'s existing per-player failure isolation and non-zero exit for alerting (GitHub's own
workflow-failure notification is the alert — no custom alerting), and no-ops cleanly when a week
produces no changes. The only human step is out-of-band: a maintainer must add the two NPSSO
tokens as repo secrets, which the README will document.

## Scope

### In Scope
- New `.github/workflows/sync.yml`: weekly cron + manual (`workflow_dispatch`) trigger, mirrors
  `ci.yml` setup, runs `pnpm sync` with secrets, commits `data/` changes to `main`.
- Clean no-op when nothing changed; loud failure (non-zero exit) when a sync fails.
- README Setup documentation for the required repo secrets, their location, cadence, and token
  expiry/refresh.

### Out of Scope
- Custom alerting / notifications beyond GitHub's built-in workflow-failure emails.
- Any change to the sync CLI, snapshot format, or stats layer.
- Automating secret creation (impossible for an agent; documented for the maintainer).
- Analytics/trend views that consume the accumulated history (#7).

## Acceptance Criteria

1. `.github/workflows/sync.yml` exists with a weekly cron trigger, checks out the repo, sets up
   Node + pnpm mirroring `ci.yml` exactly, installs deps, and runs `pnpm sync` with `NPSSO_DAD`
   / `NPSSO_BRAIDAN` from `secrets.*`.
2. Changed `data/` files are committed to `main` with a bot identity and a clear message; the
   job no-ops cleanly when nothing changed.
3. The job fails loudly on sync failure (no custom alerting); the choice is documented in a
   workflow comment.
4. README Setup documents the required secrets (`NPSSO_DAD`, `NPSSO_BRAIDAN`), where to add them,
   and the ~2-month token expiry / manual-refresh need.
5. The workflow YAML is valid and its Node/pnpm setup steps match `ci.yml`'s actions/versions.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Author the scheduled sync workflow | `.github/workflows/` |
| 2 | Document required secrets + cadence | `README.md` |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Expired token(s) silently stop history | Med | `sync.ts` exits non-zero → job fails → GitHub notification; README documents refresh |
| Empty/failing commit when nothing changed | Low | `git status --porcelain data/` guard before commit/push |
| Data commit re-triggers full CI on `main` | Low | `[skip ci]` in the bot commit message |
| Setup steps drift from `ci.yml` | Low | Copy the three setup steps verbatim; AC5 checks parity |

## Effort Estimate

**Overall:** Small (< 1 day)

| Phase | Estimate |
|---|---|
| Phase 1 (workflow) | ~0.3 day |
| Phase 2 (README) | ~0.1 day |

Note: the first real run also depends on the maintainer adding the two repo secrets, which is
outside implementation effort.

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement both phases.
3. Maintainer adds `NPSSO_DAD` / `NPSSO_BRAIDAN` repo secrets, then triggers a manual
   `workflow_dispatch` run to verify.
4. After the change is merged, archive `.agents/issue-planner/8/` and close the issue.
