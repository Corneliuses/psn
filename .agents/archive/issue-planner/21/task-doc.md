# Task Doc — Phase 7: Design documentation — README + AGENTS.md design-system guidelines (#21)

## Prerequisites

- [x] #15–#20 landed and merged (all CLOSED) — the shipped design system exists to document
- [x] Branch `claude/issue-planner-xm7gq1` is current with `origin/main`
- [ ] Chromium available at `/opt/pw-browsers/chromium` (pre-installed; do **not** run `playwright install`)

## Phase 1: Capture screenshots

- [ ] Build/serve the site offline: `pnpm --filter site build` then serve `site/dist` (e.g. `pnpm --filter site preview`), or run `pnpm --filter site dev` — the site reads committed fixture snapshots, no credentials needed
- [ ] Write a short capture script (scratchpad) using Playwright + `executablePath: '/opt/pw-browsers/chromium'`, dark viewport ~1280×800, to screenshot:
  - [ ] Splash `/` → `docs/screenshots/splash.png`
  - [ ] A player page `/<player-key>` (first key from `psn.config.json`) → `docs/screenshots/player.png`
  - [ ] Compare `/compare` → `docs/screenshots/compare.png`
- [ ] Give animations a moment to settle before capture (or capture with reduced motion) so pages aren't mid-entrance
- [ ] Verify each PNG exists and is non-empty (`ls -l docs/screenshots/`)

## Phase 2: AGENTS.md edits

- [ ] Update **Tech Stack** (`AGENTS.md` ~L23–31): add a line for the site's UI stack — Tailwind CSS 4 via `@tailwindcss/vite`, Motion (`motion/react`), self-hosted `@fontsource-variable/source-sans-3`
- [ ] Update **Repository Structure** (`AGENTS.md` ~L7–19): surface `site/src/styles/` (design tokens/theme) and `site/src/motion/` (shared presets) in the tree
- [ ] Replace the existing **"`site/` UI conventions"** section (`AGENTS.md` ~L69–101) with a consolidated **"Designing views & components"** section covering, as hard rules:
  - [ ] **Tokens**: single source of truth `site/src/styles/theme.css` `@theme`; use generated utilities (`bg-surface-0`, `text-ps-blue`, `shadow-glow`, `rounded-panel`, …); never hardcode hex/durations/shadows — extend tokens centrally; small blue text uses `text-ps-blue-text` (AA), brand `text-ps-blue` for large text/glows/fills/focus ring
  - [ ] **Compose the kit**: build from `GlassCard`, `StatTile`, `TrophyBadge`, `SectionHeader`, `AnimatedNumber`, redesigned `GameSection` (`site/src/components/`) before inventing; new primitives go in `site/src/components/` **with tests**
  - [ ] **Animation**: compose `site/src/motion/presets.ts` (`fadeRise`, `staggerChildren`, `glowPulse`, tokenized `duration`/`easing`); app is wrapped in `<MotionConfig reducedMotion="user">` — but that only neutralizes transform/layout, so gate ambient non-transform loops (box-shadow/opacity) on `useReducedMotion()` explicitly (as `HeroIllustration` does); `AnimatedNumber` renders final value under reduced motion + jsdom → tests assert the final number
  - [ ] **Route/shell rules** (carried over from old section): every route renders inside `AppShell` (persistent header/nav, kept outside the animated region); nav links derive from `players`, never hardcoded keys; route-level transitions are centralized in `App.tsx` (`AnimatePresence mode="wait"` + `RouteTransition`) — pages own only their internal stagger, never a second route-level transition
  - [ ] **PS-vibe boundaries**: dark-only theme; shape glyphs (△ ○ ✕ □) `aria-hidden` decoration only; trophy-metal colors reserved for trophy data; **no Sony logos or trademarked assets**
  - [ ] **Ship checklist** for any new view: semantic roles/names testable in jsdom; WCAG AA contrast via existing token pairs; visible keyboard focus (PS-blue `:focus-visible` ring); entrance choreography from presets; `pnpm --filter site lint`/`typecheck`/`test`/`build` green

## Phase 3: README.md edits

- [ ] Update the intro line (`README.md:3`): drop "Site UI is under construction; the data layer below is live" — state the site is shipped (dark PS5-style UI: splash, per-player pages, head-to-head compare)
- [ ] Update the "How it works" diagram (`README.md:8`): replace `site (coming)` with the live site (e.g. `site` / `React + Tailwind + Motion`)
- [ ] Add a **Design language** section: dark PS5-style theme; token (`theme.css` `@theme`) + component-kit + motion-preset architecture; the no-trademarks boundary; embed `docs/screenshots/*.png` (splash + one or two more)
- [ ] Update the **Built with agentic-config** table: add a `milestone-planner` row for the **Design v1 — PlayStation-vibe UI** milestone linking its issues (#15–#21) and the PRs that closed them (#15→#22, #16→#23, #17→#24, #18→#25, #19→#28, #20→#29); ensure the `issue-planner`/`finalize-issue`/`code-review-comment` rows reflect #20 as well (currently they stop at #19)

## Phase 4: Stale-reference sweep & coordination

- [ ] Grep across docs + code comments (exclude `node_modules`, `.agents/archive/`) for `PlaceholderGraphic`, `Coming soon`, `under construction`, `site (coming)`, `coming)` — confirm none remain (expected: only the two README lines edited above, plus historical mentions inside closed-issue planning archives which are fine to leave)
- [ ] Add a one-line coordination note (in the PR body, not the docs) flagging to #10 that the "under construction"/"site (coming)" de-staling and the agentic-config table are already updated here

## Pre-Commit Gate

Verification commands (from `AGENTS.md` "Commands"):

- [ ] `pnpm lint` ✅
- [ ] `pnpm --filter site lint` ✅
- [ ] `pnpm --filter site test` ✅
- [ ] `pnpm --filter site build` ✅

(`pnpm typecheck` / `pnpm --filter site typecheck` are docs-neutral but cheap — run if any doubt.)

## Files Modified / Created

| File | Change |
|---|---|
| `AGENTS.md` | Tech Stack + Repository Structure updates; "`site/` UI conventions" → consolidated "Designing views & components" hard-rules section |
| `README.md` | De-stale intro + diagram; new Design language section w/ screenshots; agentic-config table gains Design v1 `milestone-planner` row + #20 links |
| `docs/screenshots/splash.png` | **New** — captured splash page |
| `docs/screenshots/player.png` | **New** — captured player page |
| `docs/screenshots/compare.png` | **New** — captured compare page |
| `.agents/issue-planner/21/*` | Planning docs (this set); archived on finalize |

## Commit & Push

- [ ] Commit on `claude/issue-planner-xm7gq1` with a descriptive message (docs + screenshots for #21)
- [ ] `git push -u origin claude/issue-planner-xm7gq1` (retry with backoff on network error)
- [ ] Do **not** open a PR unless explicitly asked
