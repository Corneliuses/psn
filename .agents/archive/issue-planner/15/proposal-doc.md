# Proposal — Phase 1: Foundation — Tailwind 4, Motion, PlayStation design tokens, app shell (#15)

## Executive Summary

The `site/` package renders with no styling at all today — no CSS, no fonts, no shell. This
issue installs the complete visual foundation for the "Design v1 — PlayStation-vibe UI"
milestone: **Tailwind CSS 4** (CSS-first `@theme` config), the **Motion** animation library,
the full **PlayStation-inspired design-token set** (dark surface scale, PS-blue hero accent,
decorative shape-glyph colors, trophy metals, type/radius/glow tokens), a **self-hosted Source
Sans 3 Variable** font, and a persistent **`AppShell`** (sticky translucent header with a
wordmark and active-aware nav) that every route renders inside.

The approach stays deliberately minimal and idiomatic: Tailwind 4's native CSS-first model (no
JS config), react-router's `NavLink` for the active indicator, and a children-wrapping shell
that leaves the existing route tree — and its regression test — untouched. No Sony logos or
trademarked assets are used; PlayStation shape colors evoke the vibe without imitation. Because
every other issue in the milestone (#16–#21) is blocked on this, the goal is a solid,
composable base: shared Motion presets and design tokens that later work extends rather than
redefines.

## Scope

### In Scope
- New deps in `site/package.json`: `tailwindcss`, `@tailwindcss/vite`, `motion`, `@fontsource-variable/source-sans-3`.
- Tailwind Vite plugin registration in `site/vite.config.ts`.
- `site/src/styles/theme.css`: Tailwind import + `@theme` token set + global base styles.
- Font + stylesheet import and `<MotionConfig>` wrap in `site/src/main.tsx`; `theme-color` meta in `site/index.html`.
- `site/src/motion/presets.ts`: shared `fadeRise`, `staggerChildren`, `glowPulse` presets.
- `site/src/components/AppShell.tsx`: sticky header + nav, wrapping all routes in `site/src/App.tsx`.
- `AppShell` component test; existing `routes.test.tsx` kept green and unchanged.

### Out of Scope
- Restyling individual pages/components (`SplashPage`, `PlayerPage`, `ComparePage`, `GameSection`, `PlaceholderGraphic`) — later milestone issues (#17–#21).
- The component kit (buttons, cards, trophy chips, etc.) — #16.
- Any data-layer, stats, or snapshot changes — architecturally excluded from `site/`.
- Light theme / theme switching — the milestone is dark-only by decision.
- Visual-regression / snapshot tooling — none exists in the repo and none is added here.

## Acceptance Criteria

1. `site/package.json` adds `tailwindcss`, `@tailwindcss/vite`, `motion`, `@fontsource-variable/source-sans-3`; `pnpm-lock.yaml` updated.
2. `@tailwindcss/vite` plugin registered in `site/vite.config.ts` without breaking the React plugin or Vitest config.
3. `site/src/styles/theme.css` begins with `@import "tailwindcss";` and defines all tokens (surface scale, PS-blue accent + hover/glow, four shape colors, four trophy metals, type scale, radii, glow shadows) in `@theme`.
4. Global base styles present: dark `body` bg/text, Source Sans 3 Variable font stack, PS-blue `:focus-visible` ring, selection color.
5. Font and `theme.css` imported in `site/src/main.tsx`.
6. `site/index.html` has a `<meta name="theme-color">` set to the surface color.
7. `site/src/motion/presets.ts` exports `fadeRise`, `staggerChildren`, `glowPulse` with tokenized durations/easings.
8. App wrapped in `<MotionConfig>` in `site/src/main.tsx`.
9. `AppShell` renders a sticky translucent header (wordmark + nav to each player page and `/compare` with an active-route indicator) and wraps all routes in `site/src/App.tsx`; route structure unchanged.
10. `AppShell` component test passes (nav links by role/name, active state); `site/src/routes.test.tsx` passes unchanged.
11. `pnpm --filter site lint`, `typecheck`, `test`, and `build` all pass.

## Implementation Phases

Single phase — the work is small and tightly coupled within one package. Logical ordering:

| Step | Description | Areas Affected |
|---|---|---|
| 1 | Add deps + register Tailwind Vite plugin | `site/package.json`, `pnpm-lock.yaml`, `site/vite.config.ts` |
| 2 | Design tokens + global base styles | `site/src/styles/theme.css` |
| 3 | Wire entry point + document | `site/src/main.tsx`, `site/index.html` |
| 4 | Shared Motion presets | `site/src/motion/presets.ts` |
| 5 | `AppShell` + wrap routes | `site/src/components/AppShell.tsx`, `site/src/App.tsx` |
| 6 | Tests + green gate | `site/src/components/AppShell.test.tsx` |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Vite plugin ordering / Vitest config collision in `vite.config.ts` | Med | Add `tailwindcss()` to `plugins` only; leave `test` block untouched; verify via test + build. |
| Shell wordmark collides with page `<h1>`s that `routes.test.tsx` asserts on | Med | Give the wordmark a distinct accessible name/role; run `routes.test.tsx` unchanged before committing. |
| Tailwind 4 `@theme` token naming must follow namespaces to generate utilities | Med | Use `--color-*` / `--shadow-*` / `--radius-*` / `--text-*`; prove one generated utility compiles in `AppShell`. |
| Wrong fontsource package (variable vs static) | Low | Use `@fontsource-variable/source-sans-3` and confirm `build` resolves its CSS import. |
| `react-refresh` warning on `presets.ts` non-component exports | Low | Plain-constant `.ts` module; warnings don't fail lint — confirm no errors. |

## Effort Estimate

**Overall:** Small (1–2 days).

| Step | Estimate |
|---|---|
| 1 — deps + plugin | ~1–2h |
| 2 — tokens + base styles | ~2–4h (getting the token set + glassy surfaces right) |
| 3 — entry wiring | ~0.5h |
| 4 — motion presets | ~1–2h |
| 5 — AppShell + wrap | ~2–3h |
| 6 — tests + green gate | ~1–2h |

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement the single phase, running the pre-commit gate before committing.
3. After the implementing PR is merged, delete `.agents/issue-planner/15/` and close the issue.
