# Design Doc — Phase 1: Foundation — Tailwind 4, Motion, PlayStation design tokens, app shell (#15)

## Overview

The `site/` package currently ships with **zero styling** — no CSS files, no stylesheet
link, no style imports anywhere. This issue lays the entire visual foundation for the
"Design v1 — PlayStation-vibe UI" milestone: Tailwind CSS 4, the Motion animation library,
the full PlayStation-inspired design-token set, a self-hosted display font, and the
persistent app shell (sticky header + nav) that every route renders inside. Every other
issue in the milestone (#16–#21) is blocked on this landing.

## Acceptance Criteria

- [ ] AC1 — `site/package.json` gains deps `tailwindcss` + `@tailwindcss/vite` (Tailwind 4), `motion`, and `@fontsource-variable/source-sans-3`; `pnpm-lock.yaml` updated.
- [ ] AC2 — The Tailwind Vite plugin is registered in `site/vite.config.ts` (alongside the existing React plugin, without breaking the Vitest config block).
- [ ] AC3 — `site/src/styles/theme.css` exists, starts with `@import "tailwindcss";`, and defines **all** tokens below in an `@theme` block.
- [ ] AC4 — Global base styles (dark `body` bg/text, Source Sans 3 Variable font stack, PS-blue `:focus-visible` ring, selection color) live in `theme.css`.
- [ ] AC5 — The font and `theme.css` are imported in `site/src/main.tsx`.
- [ ] AC6 — `site/index.html` gains a `<meta name="theme-color">` set to the page surface color.
- [ ] AC7 — `site/src/motion/presets.ts` exports shared Motion variants + transition presets (`fadeRise`, `staggerChildren`, `glowPulse`) with tokenized durations/easings.
- [ ] AC8 — The app is wrapped in `<MotionConfig>` in `site/src/main.tsx`.
- [ ] AC9 — An `AppShell` layout component (sticky translucent header: wordmark, nav links to every player page + `/compare`, active-route indicator) wraps all routes in `site/src/App.tsx`; the route structure itself is unchanged.
- [ ] AC10 — A component test covers `AppShell` (nav links by role/name, active state); the existing `site/src/routes.test.tsx` keeps passing **unchanged**.
- [ ] AC11 — `pnpm --filter site lint`, `typecheck`, `test`, and `build` all pass.

### Required design tokens (`@theme`)

| Group | Tokens |
|---|---|
| Surface scale | `--color-surface-0` ≈ `#0B0F1A` (page) → elevated glassy layers (semi-transparent white overlays + 1px borders) |
| Hero accent | `--color-ps-blue: #0070D1` + hover + glow variants |
| PS shape accents (decorative only) | `--color-shape-triangle: #00AC9F`, `--color-shape-circle: #DF0024`, `--color-shape-cross: #2E6DB4`, `--color-shape-square: #E44892` |
| Trophy metals | `--color-trophy-bronze: #CD7F32`, `--color-trophy-silver: #C7CCD6`, `--color-trophy-gold: #FFC933`, `--color-trophy-platinum: #DDE3F0` |
| Scale/effects | Type scale, radii, and glow `--shadow-*` tokens |

## Architecture & Data Model

### Data Layer

**None.** This issue touches no data. Per the AGENTS.md architecture rule, `site/` reads only
the `psn` workspace package's stats layer and `data/*/latest.json` — this change touches
neither. It is purely presentational infrastructure.

### API / Service Layer

**None.** No endpoints, functions, or services.

### UI Component Tree

```
main.tsx
  <StrictMode>
    <MotionConfig reducedMotion="user">      ← new wrapper (AC8)
      <BrowserRouter>
        <App>
          <AppShell>                          ← new layout (AC9)
            <header> wordmark + <nav> (NavLink × players + /compare)
            <main> {routed page via <Routes>/<Outlet> or children}
          </AppShell>
```

`AppShell` renders the sticky header and wraps the existing `<Routes>` tree. Nav links use
react-router's `NavLink` so the active-route indicator comes from its `isActive` state rather
than manual `useLocation` comparison. Player links are generated from `players`
(`site/src/config/players.ts`) and `playerPath`/`COMPARE_PATH` (`site/src/routes.ts`) — never
hardcoded, matching the existing `SplashPage` pattern.

## Key Decisions

### Decision 1: How AppShell wraps the routes

**Options considered:**
- Option A — `AppShell` renders `{children}` and `App.tsx` nests `<Routes>` inside `<AppShell>`.
- Option B — Use a react-router layout route (`<Route element={<AppShell/>}>` with `<Outlet/>`).

**Decision:** Option A (children-wrapping).
**Rationale:** The issue states "route structure itself must not change" and `routes.test.tsx`
must pass **unchanged**. Option B restructures the route tree (parent layout route + `Outlet`),
which risks altering matching semantics the existing test relies on. Option A keeps the exact
`<Routes>` block from `App.tsx:10-21` intact and simply wraps it — the smallest change that
satisfies AC9 + AC10.

### Decision 2: Active-route indicator mechanism

**Options considered:**
- Option A — `NavLink` with its built-in `isActive` render prop / `.active` class.
- Option B — Manual `useLocation()` + string comparison per link.

**Decision:** Option A (`NavLink`).
**Rationale:** `NavLink` is the idiomatic react-router 7 primitive, gives an accessible
`aria-current="page"` for free (which the test can assert on), and avoids re-implementing path
matching. `end` prop is used where needed so `/compare` doesn't mark the wordmark/home active.

### Decision 3: Reduced-motion handling

**Options considered:**
- Option A — `<MotionConfig reducedMotion="user">` (respects OS `prefers-reduced-motion`).
- Option B — Bare `<MotionConfig>` with no reduced-motion policy.

**Decision:** Option A.
**Rationale:** The issue mandates a `<MotionConfig>` wrapper and this is the foundation every
later animation composes onto. Setting `reducedMotion="user"` once here makes accessibility the
default for the whole milestone at no extra per-animation cost.

### Decision 4: Tailwind 4 config style (CSS-first vs JS config)

**Options considered:**
- Option A — CSS-first: `@import "tailwindcss";` + `@theme { … }` in `theme.css`, no `tailwind.config.js`.
- Option B — Legacy `tailwind.config.js` with a `theme.extend` object.

**Decision:** Option A (CSS-first).
**Rationale:** This is the native Tailwind 4 model and exactly what the issue's task list
describes (`@theme` block in `theme.css`). No JS config file is created.

## Security & Permissions

**Not applicable.** No auth, no roles, no data access, no network. Purely static styling and
layout. The only external assets are the self-hosted `@fontsource-variable/source-sans-3`
font (bundled, not fetched at runtime) — consistent with the milestone rule of using no Sony
logos or trademarked assets.

## Error Handling

**Minimal — no runtime data paths.** The only defensive concern is the app shell rendering
before/around routes: `AppShell` must render its `children` unconditionally so the existing
`NotFoundPage` and player-not-found states continue to surface inside the shell. No new error
states are introduced.

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Layout | Component (unit) | `site/src/components/AppShell.test.tsx` (new) | Render inside `MemoryRouter`; assert a nav link for every `players` entry + a `Compare` link with correct `href`; assert active state (`aria-current="page"`) for the current route. Mirror the query style in `SplashPage.test.tsx`. |
| Routing (regression) | Component | `site/src/routes.test.tsx` (unchanged) | Must keep passing verbatim — proves the shell wrap didn't alter route matching. |
| Build/type | Static | n/a | `tsc --noEmit` + `vite build` confirm Tailwind plugin + CSS import compile. |

CSS tokens and visual appearance are **not** unit-tested (no visual-regression harness exists
in this repo); correctness of tokens is verified by build success and manual dev-server check.

## Config Changes

- [ ] Schema / index changes — **none required** (no data layer touched).
- [ ] Access rule changes — **none required**.
- [ ] Environment variables — **none required**.
- [ ] Dependency changes — add `tailwindcss`, `@tailwindcss/vite`, `motion`, `@fontsource-variable/source-sans-3` to `site/package.json`; `pnpm-lock.yaml` regenerated by `pnpm install`.
- [ ] Build config — register `@tailwindcss/vite` plugin in `site/vite.config.ts`.

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| Vite plugin ordering / Vitest config collision in `vite.config.ts` | Med | Add `tailwindcss()` to the `plugins` array only; leave the `test` block untouched. Confirm via `pnpm --filter site test` (jsdom) + `build`. |
| `react-refresh/only-export-components` warns on `motion/presets.ts` (non-component exports) | Low | It's a `.ts` file exporting plain constants; the rule targets component modules and `allowConstantExport` is on. Verify with `pnpm --filter site lint` (warnings don't fail lint, but confirm none are errors). |
| Active-route indicator marks wordmark/home active on every route | Low | Use `NavLink` `end` prop on the root/home link so it only matches `/` exactly. |
| Existing `routes.test.tsx` breaks because shell adds extra headings/landmarks | Med | Tests query by specific accessible name/role; the shell's wordmark must not collide with page `<h1>`s (use a distinct wordmark text / lower heading level or non-heading element). Run `routes.test.tsx` before committing. |
| Self-hosted font import path wrong (`@fontsource-variable` vs `@fontsource`) | Low | Use the **variable** package `@fontsource-variable/source-sans-3` and import its CSS entry in `main.tsx`; confirm `build` resolves it. |
| `@theme` token names must follow Tailwind 4 namespaces to generate utilities | Med | Use Tailwind 4 conventions (`--color-*`, `--shadow-*`, `--radius-*`, `--text-*`) so utilities like `bg-surface-0` are generated; verify by using one such utility in `AppShell` and building. |
