# psn

Father–son PlayStation stats tracker for two players (Dad and Braidan): syncs play history and trophy data from PSN into committed JSON snapshots, derives displayable stats, and (in future milestones) renders them as a website with per-player pages and a comparison view.

## Repository Structure

```
psn/
├── src/
│   ├── psn/        # PSN API layer: auth, retry, fetch, raw→domain mapping
│   ├── snapshot/   # Snapshot persistence (data/<player>/<date>.json + latest.json)
│   ├── stats/      # Pure stat functions over snapshots — the only module a UI should read
│   ├── cli/        # `pnpm sync` entrypoint and psn.config.json loading
│   └── fixtures/   # Sample data powering tests and --dry-run (fake numbers, never commit as real)
├── data/           # Committed real snapshots, one dir per player key
├── test/           # Vitest suites, one file per module
└── .claude/skills/ # Workflow skills installed from Corneliuses/agentic-config
```

## Tech Stack

- **Language**: TypeScript 5, strict mode, ESM (`type: module`)
- **Runtime**: Node 22+ (uses `process.loadEnvFile`, `util.parseArgs`)
- **PSN access**: [`psn-api`](https://github.com/achievements-app/psn-api) — import it only via `src/psn/api.ts` (CJS/ESM interop shim); never import `psn-api` functions directly elsewhere
- **Testing**: Vitest, fixture-based — no test may require credentials or network
- **Lint / Format**: ESLint (flat config, typescript-eslint)
- **Build**: tsup (library + CLI), tsx for running the CLI from source

## Commands

| Purpose | Command |
|---|---|
| Install deps | `pnpm install` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Test (all) | `pnpm test` |
| Test (single file) | `pnpm vitest run test/stats.test.ts` |
| Build | `pnpm build` |
| Sync snapshots (needs `.env`) | `pnpm sync` |
| Sync pipeline without credentials | `pnpm sync --dry-run` |

Before committing, lint, typecheck, tests, and build must all pass.

## Architecture Rules

- **Data flows one way**: PSN API → `src/psn` → snapshot files in `data/` → `src/stats` → UI. A future UI reads snapshots and `src/stats` only — it must never call the PSN client.
- **`src/stats` stays pure**: snapshot in, stats out, no I/O. Every new stat function ships with fixture-based tests including empty-snapshot and tie cases.
- **Snapshots are diff-friendly**: stable key order, arrays sorted by stable IDs, 2-space indent, trailing newline. Preserve this — committed snapshot history doubles as the trend-analytics dataset.
- **`schemaVersion` guards `PlayerSnapshot`**: bump it and handle old versions in readers if the shape changes; committed history must stay loadable.

## Security & Secrets

- NPSSO tokens live in `.env` (gitignored) or CI secrets, named per `psn.config.json` (`NPSSO_DAD`, `NPSSO_BRAIDAN`). Never commit, log, or embed tokens in error messages — `PsnAuthError` names the env var, never the value.
- `data/` holds only *real* synced snapshots. Dry-run output is fixture data and must not be committed as if it were real.

## Working Rules

### Deferred work always gets a ticket

Any work you identify but defer out of the current change — a refactor you're not doing, an edge case you're not handling, a pre-existing failure you're not fixing — must have a GitHub issue created **immediately**, before you move on. If you write "I'll track this separately", "out of scope", or "in a follow-up", the very next action is creating that issue and linking it where you deferred the work (PR body, code comment, or review reply). Never defer work with only a prose note.
