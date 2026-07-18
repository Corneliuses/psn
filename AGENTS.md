# psn

Father–son PlayStation stats tracker for two players (Dad and Braidan): syncs play history and trophy data from PSN into committed JSON snapshots, derives displayable stats, and renders them as a website (`site/`) with a splash landing, per-player pages, and a head-to-head comparison view in a dark, PlayStation-vibe UI.

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
│   └── src/
│       ├── styles/     # theme.css — CSS-first Tailwind 4 `@theme` design tokens (single source of truth)
│       ├── motion/     # presets.ts — shared Motion variants/transitions all animation composes
│       ├── components/ # PlayStation component kit (GlassCard, StatTile, TrophyBadge, …) + AppShell
│       └── pages/      # Splash, Player, Compare, NotFound — each composes the kit
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
- **Site UI** (`site/`): React 19 + Vite 7; [Tailwind CSS 4](https://tailwindcss.com) via `@tailwindcss/vite` (CSS-first `@theme`, no `tailwind.config.js`); [Motion](https://motion.dev) (`motion/react`) for animation; self-hosted display font via `@fontsource-variable/source-sans-3`; React Router 7. See **Designing views & components** below before building UI.

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
| Browser smoke test (E2E) | `pnpm --filter site test:e2e` |
| Build | `pnpm --filter site build` |

`site` has its own ESLint config, TypeScript config, and Vitest suite, run separately from the root package's. Root `pnpm test` only runs `test/` (the data-layer lib); it does not run `site`'s tests.

`pnpm --filter site test:e2e` is a `@playwright/test` smoke suite (`site/e2e/`) that runs against the **production build** — its Playwright config runs `vite build` then serves `dist/` via `vite preview`, so a build-only break (e.g. a Node-only transitive import that breaks `vite build` while every jsdom test stays green) fails it, which the jsdom `pnpm --filter site test` run cannot catch. It needs a Playwright Chromium binary: locally the dev container pre-provisions one (`PLAYWRIGHT_BROWSERS_PATH`); CI runs it in a dedicated `site-e2e` job that installs Chromium via `playwright install --with-deps chromium`. The `e2e/` specs are excluded from the Vitest run, so `pnpm --filter site test` never launches a browser.

## Architecture Rules

- **Data flows one way**: PSN API → `src/psn` → snapshot files in `data/` → `src/stats` → UI. `site/` reads `data/*/latest.json` snapshots and `src/stats` (via the `psn` workspace package) only — it must never import `src/psn/` directly.
- **`src/stats` stays pure**: snapshot in, stats out, no I/O. Every new stat function ships with fixture-based tests including empty-snapshot and tie cases.
- **Snapshots are diff-friendly**: stable key order, arrays sorted by stable IDs, 2-space indent, trailing newline. Preserve this — committed snapshot history doubles as the trend-analytics dataset.
- **`schemaVersion` guards `PlayerSnapshot`**: bump it and handle old versions in readers if the shape changes; committed history must stay loadable.

## Designing views & components

The `site/` design system — a dark, PlayStation-vibe language — shipped across the "Design v1"
milestone (#15–#21). It is the single visual vocabulary for the site: **every new view or component
composes it rather than reinventing one.** The rules below are hard requirements, not suggestions.

### 1. Tokens are the single source of truth

- All colors, type sizes, radii, and shadows come from the CSS-first `@theme` block in
  **`site/src/styles/theme.css`**. Style with the generated token utilities (`bg-surface-0`,
  `text-ps-blue`, `shadow-glow`, `rounded-panel`, `text-display`, …). Motion timing is **not** a
  theme token — the `duration`/`easing` primitives live in `site/src/motion/presets.ts` (see
  Animation below).
- **Never introduce a raw hex color, a one-off shadow, or an ad-hoc duration/easing in a component.**
  If a value you need doesn't exist, extend it centrally rather than inline: colors, radii, and
  shadows get a new token in `theme.css`; durations and easings get a new entry in
  `motion/presets.ts`. Keeping the vocabulary central keeps it reusable and auditable.
- For small blue **text**, use `text-ps-blue-text` (the AA-compliant lighter variant). The brand
  `text-ps-blue` (#0070d1) only clears WCAG AA at large sizes — reserve it for large headings,
  glows, fills, and the focus ring.

### 2. Compose the kit before inventing a primitive

- Card-like and stat UI is built from the existing kit in **`site/src/components/`**: `GlassCard`
  (the shared elevated glass surface every card builds on), `StatTile`, `TrophyBadge`,
  `SectionHeader`, `AnimatedNumber`, and the redesigned `GameSection`. Compose these rather than
  re-styling surfaces or re-implementing count-ups.
- A genuinely new primitive (not expressible by composing the kit) also lives in
  `site/src/components/` and **ships with a component test** (render, accessible name,
  reduced-motion/jsdom-safe final state) in the same PR.
- `AnimatedNumber` renders its final value immediately under reduced motion and in jsdom (no
  timers), so component tests assert the **final** number, never intermediate animation state.

### 3. Animation composes the shared presets

- Every entrance/hover composes the shared presets in **`site/src/motion/presets.ts`** (`fadeRise`,
  `staggerChildren`, `glowPulse`, plus tokenized `duration`/`easing`) — do not redefine timing or
  easing inline.
- The app is wrapped in `<MotionConfig reducedMotion="user">`, so honour reduced motion — but note
  it only neutralizes **transform/layout** animations. An ambient non-transform loop (a `box-shadow`
  glow, an opacity pulse) keeps running, so gate those on `useReducedMotion()` explicitly (as
  `HeroIllustration` does). Under reduced motion every page must render **complete and static** — no
  content stuck at an initial animation state.
- `glowPulse` layers the base `--shadow-panel` under the glow in every keyframe so an elevated
  surface keeps its drop shadow while pulsing.

### 4. Route & shell structure

- Every route renders inside **`AppShell`** (`site/src/components/AppShell.tsx`), the persistent
  header/nav. Its nav links derive from `players` (**never hardcode player keys**), and the route
  structure in `site/src/App.tsx` must stay intact.
- Route-level page transitions are centralized in `App.tsx`: the routed content is wrapped in
  `<AnimatePresence mode="wait">` + `RouteTransition` (keyed by `location.pathname`, with
  `<Routes location={location}>`). Each page owns only its **own** internal entrance stagger — never
  add a second route-level transition, and keep `AppShell` **outside** the animated region so the
  header stays persistent.

### 5. PlayStation-vibe boundaries

- **Dark-only** theme — there is no light mode; don't add one or design for it.
- The four shape glyphs (△ ○ ✕ □) and their `--color-shape-*` tokens are **decorative motifs only**:
  render them `aria-hidden` and never as the sole carrier of meaning.
- The trophy-metal colors (`--color-trophy-bronze/silver/gold/platinum`) are **reserved for trophy
  data** — don't repurpose them as general accents.
- **No Sony logos or trademarked assets.** The vibe is evoked with original silhouettes and the four
  abstract shapes; never import or recreate PlayStation branding.

### 6. Ship checklist for any new view

Before a view is done, confirm all of:

- [ ] **Semantics**: roles and accessible names are testable in jsdom (headings by role/name, one
  `listitem` per item, decorative images have empty `alt` / are `aria-hidden`).
- [ ] **Contrast**: every text/surface pair meets WCAG AA (4.5:1 body, 3:1 large text) using
  existing token pairs — fix contrast by adjusting tokens centrally, not per-usage.
- [ ] **Keyboard**: logical focus order; the PS-blue `:focus-visible` ring is visible on every
  interactive element; decorative animations never receive focus.
- [ ] **Motion**: entrance choreography is composed from the presets and resolves to a complete
  static state under reduced motion.
- [ ] **Gate green**: `pnpm --filter site lint`, `pnpm --filter site typecheck`,
  `pnpm --filter site test`, and `pnpm --filter site build` all pass.

## Security & Secrets

- NPSSO tokens live in `.env` (gitignored) or CI secrets, named per `psn.config.json` (`NPSSO_DAD`, `NPSSO_BRAIDAN`). Never commit, log, or embed tokens in error messages — `PsnAuthError` names the env var, never the value.
- `data/` holds only *real* synced snapshots. Dry-run output is fixture data and must not be committed as if it were real. **Exception:** `data/dad/latest.json` and `data/braidan/latest.json` are currently committed *fixture* snapshots (generated via `sampleSnapshot()`), added in #4 so `site/` has something to import before real sync (#8) lands. Once #8 runs for real, these must be overwritten with genuine synced data, not left in place.

## Working Rules

### Deferred work always gets a ticket

Any work you identify but defer out of the current change — a refactor you're not doing, an edge case you're not handling, a pre-existing failure you're not fixing — must have a GitHub issue created **immediately**, before you move on. If you write "I'll track this separately", "out of scope", or "in a follow-up", the very next action is creating that issue and linking it where you deferred the work (PR body, code comment, or review reply). Never defer work with only a prose note.

### Every PR has What / Why / How to test

Every pull request description must have three sections, in this order: **What was done**, **Why it was done**, and **How to manually test / verify**. `.github/pull_request_template.md` pre-fills this structure — fill it in, don't remove it. The "how to test" section must give a reviewer exact, runnable steps (commands, URLs, expected output), not a restatement of the test suite.
