# Design Doc — Phase 7: Design documentation — README + AGENTS.md design-system guidelines (#21)

## Overview

The "Design v1 — PlayStation-vibe UI" milestone (#15–#20) shipped a full dark PS5-style
design system: CSS-first tokens, a reusable component kit, shared motion presets, and four
redesigned pages. This issue codifies that shipped system in the repo's docs so every future
view — built by a human or an agent — reuses the language instead of reinventing it. It is the
final, documentation-only issue in the milestone: it must describe what actually shipped, not the
plan. No product code changes; only `README.md`, `AGENTS.md`, and newly captured screenshot assets.

## Acceptance Criteria

- [ ] `AGENTS.md` has a **"Designing views & components"** section stating, as hard rules:
  - [ ] Token vocabulary + single source of truth (`site/src/styles/theme.css` `@theme`); no raw hex, ad-hoc durations, or one-off shadows — extend tokens centrally
  - [ ] Compose the kit (`GlassCard`, `StatTile`, `TrophyBadge`, `SectionHeader`, `AnimatedNumber`, redesigned `GameSection`) before inventing; new primitives go in `site/src/components/` with tests
  - [ ] Animation rules: entrances/hovers use `site/src/motion/presets.ts`; respect `prefers-reduced-motion` (`MotionConfig reducedMotion="user"` + jsdom-safe final states); `AnimatedNumber` resolves instantly in tests
  - [ ] PS-vibe boundaries: dark-only theme; shape glyphs (△ ○ ✕ □) `aria-hidden` decoration only; trophy-metal colors reserved for trophy data; no Sony logos/trademarks
  - [ ] A ship checklist for any new view (semantic roles/names testable in jsdom, WCAG AA contrast via existing token pairs, visible keyboard focus, entrance choreography from presets, verification commands green)
- [ ] `AGENTS.md` Tech Stack section names Tailwind CSS 4 via `@tailwindcss/vite`, Motion, and `@fontsource-variable/source-sans-3`
- [ ] `AGENTS.md` Repository Structure shows `site/src/styles/` and `site/src/motion/`
- [ ] `README.md` has a short design-language section (dark PS5 theme; token/kit/motion architecture) with 1–2 screenshots of the shipped pages
- [ ] `README.md`'s "Site UI is under construction; the data layer below is live" line is updated to reflect the shipped site
- [ ] `README.md`'s "How it works" diagram no longer says `site (coming)`
- [ ] `README.md`'s "Built with agentic-config" table has a `milestone-planner` row for the Design v1 milestone and links the PRs that closed its issues
- [ ] No stale references (`PlaceholderGraphic`, "Coming soon", "under construction", "site (coming)") remain in docs or code comments
- [ ] Relationship with #10 (v1-site docs issue) is coordinated, not duplicated
- [ ] `pnpm lint`, `pnpm --filter site lint`, `pnpm --filter site test`, `pnpm --filter site build` all pass

## Architecture & Data Model

Documentation-only issue — no data layer, API, or component tree changes. The "architecture"
here is the shape of the two docs and the new screenshot assets.

### Data Layer

None. No schema, snapshot, or stats changes.

### API / Service Layer

None.

### Docs & Asset Layout

| Artifact | Type | Change |
|---|---|---|
| `AGENTS.md` | Root agent doc | Consolidate existing "`site/` UI conventions" into a formal "Designing views & components" section; update Tech Stack + Repository Structure |
| `README.md` | Root readme | Add design-language section w/ screenshots; de-stale "under construction"/"site (coming)"; add `milestone-planner` (Design v1) row to agentic-config table |
| `docs/screenshots/splash.png` | Binary asset (new) | Captured splash page |
| `docs/screenshots/player.png` | Binary asset (new) | Captured player page |
| `docs/screenshots/compare.png` | Binary asset (new) | Captured compare page |

## Key Decisions

### Decision 1: Screenshots — capture real PNGs vs. prose-only

**Options considered:**
- Option A: Capture real PNGs of splash/player/compare with the pre-installed Chromium + Playwright, commit under `docs/screenshots/`, embed in the README.
- Option B: Describe the pages in prose only, no committed binaries.
- Option C: Placeholders + a follow-up issue.

**Decision:** Option A — capture real PNGs.
**Rationale:** User-confirmed. The issue explicitly asks for "a screenshot or two of the shipped
pages," and real screenshots make the design-language section concrete for humans skimming the
README. Chromium is pre-installed (`/opt/pw-browsers/chromium`) and the site runs offline against
committed fixture snapshots, so capture is reliable and reproducible. Assets live under
`docs/screenshots/` (a conventional home that keeps binaries out of `site/` source and the build).

### Decision 2: AGENTS.md — consolidate vs. add alongside

**Options considered:**
- Option A: Consolidate the existing "`site/` UI conventions" section (grown incrementally across #15–#20) into the new "Designing views & components" section.
- Option B: Add a new section alongside, leaving the old one in place.

**Decision:** Option A — consolidate into one section.
**Rationale:** User-confirmed. The existing section already covers tokens, the kit, motion, and the
route/shell rules; the issue's requested content overlaps heavily. Two overlapping sections would
drift apart and confuse agents about which is authoritative. One "Designing views & components"
section is a single source of truth. The load-bearing route/shell/reduced-motion nuances from the
old section (e.g. ambient non-transform loops must gate on `useReducedMotion()`; keep `AppShell`
outside the animated region; nav derives from `players`) are preserved, not dropped.

### Decision 3: Relationship with #10 (v1-site docs)

**Decision:** #21 owns the design-system documentation and the "under construction"/"site (coming)"
cleanup now; #10 remains open for the broader v1-site docs (dev-server/build/deploy usage,
the four analytics views, Actions-secrets setup for auto-sync). #21 does the README de-staling that
both issues reference so it isn't left half-done, and a note in the proposal flags to whoever picks
up #10 that those specific edits are already landed — coordinate, don't duplicate.
**Rationale:** The issue explicitly requires confirming this relationship; #21 is being executed
first, so it makes the shared edits and records that fact.

## Security & Permissions

No auth, roles, or access-control surface. Documentation only. One content rule to honor: the
docs must reaffirm the milestone's "no Sony logos or trademarked assets" boundary, and screenshots
must not capture any trademarked imagery (the shipped UI uses only original silhouettes and the
four abstract shape glyphs, so this holds by construction).

## Error Handling

N/A (docs). The only failure mode is the verification gate — docs-only edits shouldn't break lint,
tests, or build, but all four commands are run to confirm. Screenshot capture failure (dev server
not up, browser path wrong) is handled by launching against `/opt/pw-browsers/chromium` per the
environment guidance and verifying each PNG exists and is non-empty before embedding.

## Testing Strategy

No code under test changes. "Testing" here is the verification gate plus visual confirmation of the
captured screenshots.

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Root package | Lint | — | `pnpm lint` — confirm docs edits don't trip the gate |
| Site package | Lint | — | `pnpm --filter site lint` |
| Site package | Unit | `site/src/**/*.test.tsx` | `pnpm --filter site test` — unchanged, must stay green |
| Site package | Build | — | `pnpm --filter site build` — confirms site still builds; also produces the served bundle used for screenshots |

## Config Changes

- [ ] Schema / index changes — none required
- [ ] Access rule changes — none required
- [ ] Environment variables — none required
- [ ] Dependency changes — none required (Chromium/Playwright are pre-installed in the environment; no new repo deps)

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| Screenshot capture flaky / browser mispath | Low | Use pre-installed `/opt/pw-browsers/chromium`; don't run `playwright install`; verify each PNG exists + non-zero before embedding |
| Committed PNGs bloat the repo | Low | Keep to 2–3 reasonably-sized PNGs under `docs/screenshots/`; capture at a sane viewport, not retina-huge |
| Overlap with #10 causes duplicated/conflicting README edits later | Med | Scope #21 to design + shared de-staling; leave a coordination note for #10; don't pre-empt #10's analytics/secrets/deploy content |
| Consolidating AGENTS.md drops a load-bearing nuance from the old section | Med | Diff old vs. new section before committing; explicitly carry over reduced-motion, route-transition, and `players`-derived-nav rules |
| A stale reference is missed | Low | Grep `PlaceholderGraphic`, "Coming soon", "under construction", "site (coming)" across docs + code comments (excluding `.agents/archive/`) before committing |
| Screenshots go stale as UI evolves | Low | Acceptable for a snapshot-in-time doc; future UI-change issues own refreshing them |
