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
├── site/           # Vite + React + TS static site — reads src/stats and data/*/latest.json only
└── .claude/skills/ # Workflow skills installed from Corneliuses/agentic-config
```

This repo is a pnpm workspace (`pnpm-workspace.yaml`): the root package (`psn`) is the data-layer lib, `site/` is a separate workspace package depending on it via `workspace:*`.

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

Before committing, lint, typecheck, tests, and build must all pass — for both the root package and `site/` (see below).

### `site/` workspace commands

Run from the repo root via `pnpm --filter site <script>`, or `cd site && pnpm <script>`:

| Purpose | Command |
|---|---|
| Install deps (whole workspace) | `pnpm install` |
| Dev server | `pnpm --filter site dev` |
| Lint | `pnpm --filter site lint` |
| Typecheck | `pnpm --filter site typecheck` |
| Test | `pnpm --filter site test` |
| Build | `pnpm --filter site build` |

`site` has its own ESLint config, TypeScript config, and Vitest suite, run separately from the root package's. Root `pnpm test` only runs `test/` (the data-layer lib); it does not run `site`'s tests.

## Architecture Rules

- **Data flows one way**: PSN API → `src/psn` → snapshot files in `data/` → `src/stats` → UI. `site/` reads `data/*/latest.json` snapshots and `src/stats` (via the `psn` workspace package) only — it must never import `src/psn/` directly.
- **`src/stats` stays pure**: snapshot in, stats out, no I/O. Every new stat function ships with fixture-based tests including empty-snapshot and tie cases.
- **Snapshots are diff-friendly**: stable key order, arrays sorted by stable IDs, 2-space indent, trailing newline. Preserve this — committed snapshot history doubles as the trend-analytics dataset.
- **`schemaVersion` guards `PlayerSnapshot`**: bump it and handle old versions in readers if the shape changes; committed history must stay loadable.

## `site/` UI conventions

The site's design foundation (Tailwind CSS 4 + Motion) was established in #15; later
design-milestone work must build on it consistently:

- **Design tokens live in `site/src/styles/theme.css`** — a CSS-first `@theme` block defines the
  dark PlayStation palette (surface scale, PS-blue accent, decorative shape/trophy colors), type
  scale, radii, and glow shadows. Style with the generated token utilities (`bg-surface-0`,
  `text-ps-blue`, `shadow-glow`, …); never hardcode colors. The theme is dark-only, and uses no
  Sony logos or trademarked assets — shape glyphs/colors evoke the vibe without imitation. For small
  blue *text*, use `text-ps-blue-text` (an AA-compliant lighter variant added in #20): the brand
  `text-ps-blue` only clears WCAG AA at large sizes, so reserve it for large headings, glows, fills,
  and the focus ring.
- **Animation composes the shared presets in `site/src/motion/presets.ts`** (`fadeRise`,
  `staggerChildren`, `glowPulse`, plus tokenized `duration`/`easing`) rather than redefining
  timing inline. The app is wrapped in `<MotionConfig reducedMotion="user">`, so honour reduced
  motion — but note it only neutralizes *transform*/layout animations: an ambient non-transform
  loop (a `box-shadow` glow, an opacity pulse) keeps running, so gate those on `useReducedMotion()`
  explicitly (as `HeroIllustration` does). `glowPulse` layers the base `--shadow-panel` under the
  glow in every keyframe so an elevated surface keeps its drop shadow while pulsing.
- **Every route renders inside `AppShell`** (`site/src/components/AppShell.tsx`), the persistent
  header/nav. Its nav links derive from `players` (never hardcode player keys) and the route
  structure in `site/src/App.tsx` must stay intact. Route-level page transitions are centralized
  there (added in #20): `App.tsx` wraps the routed content in `<AnimatePresence mode="wait">` +
  `RouteTransition` (keyed by `location.pathname`, with `<Routes location={location}>`), so each page
  owns only its own internal entrance stagger — never add a second route-level transition, and keep
  `AppShell` outside the animated region so the header stays persistent.
- **Card-like UI composes the Phase 2 component kit** (`site/src/components/`, established in #16):
  `GlassCard` is the shared elevated glass surface every card builds on; `TrophyBadge`, `StatTile`,
  `SectionHeader`, and `AnimatedNumber` are the reusable primitives. Compose these rather than
  re-styling surfaces or re-implementing count-ups. `AnimatedNumber` renders its final value under
  reduced motion and in jsdom (no timers), so component tests assert the final number, not
  intermediate animation state.

## Security & Secrets

- NPSSO tokens live in `.env` (gitignored) or CI secrets, named per `psn.config.json` (`NPSSO_DAD`, `NPSSO_BRAIDAN`). Never commit, log, or embed tokens in error messages — `PsnAuthError` names the env var, never the value.
- `data/` holds only *real* synced snapshots. Dry-run output is fixture data and must not be committed as if it were real. **Exception:** `data/dad/latest.json` and `data/braidan/latest.json` are currently committed *fixture* snapshots (generated via `sampleSnapshot()`), added in #4 so `site/` has something to import before real sync (#8) lands. Once #8 runs for real, these must be overwritten with genuine synced data, not left in place.

## Working Rules

### Deferred work always gets a ticket

Any work you identify but defer out of the current change — a refactor you're not doing, an edge case you're not handling, a pre-existing failure you're not fixing — must have a GitHub issue created **immediately**, before you move on. If you write "I'll track this separately", "out of scope", or "in a follow-up", the very next action is creating that issue and linking it where you deferred the work (PR body, code comment, or review reply). Never defer work with only a prose note.

### Every PR has What / Why / How to test

Every pull request description must have three sections, in this order: **What was done**, **Why it was done**, and **How to manually test / verify**. `.github/pull_request_template.md` pre-fills this structure — fill it in, don't remove it. The "how to test" section must give a reviewer exact, runnable steps (commands, URLs, expected output), not a restatement of the test suite.
