# Proposal — Phase 7: Design documentation — README + AGENTS.md design-system guidelines (#21)

## Executive Summary

The "Design v1 — PlayStation-vibe UI" milestone (#15–#20, all merged) shipped a complete dark
PS5-style design system for `site/`: CSS-first design tokens in `theme.css`, a reusable component
kit (`GlassCard`, `StatTile`, `TrophyBadge`, `SectionHeader`, `AnimatedNumber`, redesigned
`GameSection`), shared Motion presets, and four redesigned pages. This final issue documents that
system so future views — human- or agent-built — reuse the language instead of reinventing it.

The work is documentation-only. In `AGENTS.md` we consolidate the incrementally-grown "`site/` UI
conventions" section into one authoritative **"Designing views & components"** section of hard
rules, and refresh Tech Stack + Repository Structure. In `README.md` we retire the "under
construction"/"site (coming)" language, add a **Design language** section with real captured
screenshots of the shipped pages, and extend the "Built with agentic-config" table with the Design
v1 milestone. No product code changes.

## Scope

### In Scope
- `AGENTS.md`: consolidated "Designing views & components" hard-rules section (tokens, kit, motion, route/shell, PS-vibe boundaries, ship checklist)
- `AGENTS.md`: Tech Stack (Tailwind 4 via `@tailwindcss/vite`, Motion, `@fontsource-variable/source-sans-3`) + Repository Structure (`site/src/styles/`, `site/src/motion/`)
- `README.md`: Design language section with captured screenshots; de-staled intro line + "How it works" diagram; agentic-config table updated for the Design v1 milestone (and #20)
- `docs/screenshots/`: real PNGs of splash, player, and compare pages
- Stale-reference sweep across docs and code comments

### Out of Scope (owned by #10, still open)
- Site dev-server / build / deploy usage instructions
- Documentation of the four v1 analytics views
- Actions-secrets (`NPSSO_DAD`/`NPSSO_BRAIDAN`) setup for auto-sync
- Any product code, tests, tokens, or component changes

## Acceptance Criteria

1. `AGENTS.md` has a "Designing views & components" section stating as hard rules: token vocabulary + single source of truth; compose-the-kit; animation/reduced-motion; PS-vibe boundaries (dark-only, `aria-hidden` glyphs, trophy-metal reserved, no Sony trademarks); and a per-view ship checklist.
2. `AGENTS.md` Tech Stack names Tailwind CSS 4 (`@tailwindcss/vite`), Motion, and `@fontsource-variable/source-sans-3`; Repository Structure shows `site/src/styles/` and `site/src/motion/`.
3. `README.md` has a design-language section (dark PS5 theme; token/kit/motion architecture) with 1–2 screenshots of shipped pages.
4. `README.md`'s "Site UI is under construction" line and the diagram's "site (coming)" label are updated to reflect the shipped site.
5. `README.md`'s "Built with agentic-config" table has a `milestone-planner` row for the Design v1 milestone linking its issues and closing PRs.
6. No stale references (`PlaceholderGraphic`, "Coming soon", "under construction", "site (coming)") remain in docs or code comments.
7. The relationship with #10 is coordinated, not duplicated.
8. `pnpm lint`, `pnpm --filter site lint`, `pnpm --filter site test`, and `pnpm --filter site build` all pass.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Capture real screenshots of splash/player/compare | `docs/screenshots/`, (transient scratchpad script) |
| 2 | AGENTS.md — consolidate design guidelines, Tech Stack, Repository Structure | `AGENTS.md` |
| 3 | README.md — design-language section + screenshots, de-stale, agentic-config table | `README.md` |
| 4 | Stale-reference sweep + #10 coordination note | docs + code comments (verification only) |

Phases are sequential but small; screenshots (Phase 1) come first because the README (Phase 3)
embeds them. This is deliberately light phasing for a docs issue — it reflects a natural build
order, not risk staging.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Consolidating AGENTS.md drops a load-bearing rule from the old section | Med | Diff old vs. new; explicitly carry over reduced-motion, route-transition, and `players`-derived-nav nuances |
| README edits overlap/collide with future #10 work | Med | Scope #21 to design + shared de-staling only; leave a coordination note for #10 |
| Screenshot capture flaky or browser mispath | Low | Use pre-installed `/opt/pw-browsers/chromium`; never run `playwright install`; verify PNGs before embedding |
| Committed PNGs bloat the repo | Low | 2–3 sanely-sized PNGs under `docs/screenshots/` |
| A stale reference is missed | Low | Grep the full set of phrases before committing (excluding `.agents/archive/`) |

## Effort Estimate

**Overall:** Small (well under a day)

| Phase | Estimate |
|---|---|
| Phase 1 (screenshots) | ~0.5–1 hr |
| Phase 2 (AGENTS.md) | ~0.5–1 hr |
| Phase 3 (README.md) | ~0.5–1 hr |
| Phase 4 (sweep + gate) | ~0.5 hr |

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement phase by phase.
3. After implementation is merged, archive `.agents/issue-planner/21/` (per repo convention, to `.agents/archive/issue-planner/21/`) and close the issue.
