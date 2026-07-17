# Proposal — Phase 4: Player page redesign (#18)

## Executive Summary

Redesign the per-player stats page in the Design v1 language: a player **hero header** with
a per-player accent and a subtle animated shape-glyph backdrop, a **summary row of animated
stat tiles** (games played, total trophies, platinums), and the four existing game sections
rendered through the redesigned `GameSection` with a scroll/entrance stagger between them.

The work is almost entirely presentation, composing the Phase 2 (#16) component kit —
`GlassCard`, `StatTile`, `AnimatedNumber`, `TrophyBadge`, `SectionHeader`, `GameSection` —
and the shared motion presets and theme tokens. The one non-UI change is exposing an
aggregation that already exists in the data layer: the "total trophies" number lives only in
`compare.ts`'s private `totals()` function, so we promote it to an exported
`playerTotals(snapshot)` in `src/stats` (with fixture tests, reused by `comparePlayers`).
This keeps the page a pure consumer of the stats layer, honoring the AGENTS.md rule that
derived numbers live in `src/stats`, not in the page.

## Scope

### In Scope
- Player hero header: large display name, per-player accent by config order (shape tokens),
  `aria-hidden` animated backdrop gated on reduced motion.
- Summary row of three `StatTile` count-ups sourced from `playerTotals(snapshot)`.
- Four sections through `GameSection` with scroll/entrance stagger; platinum rows show a
  `TrophyBadge`.
- Restyled unknown-player and no-snapshot fallback states.
- Promote `playerTotals` into `src/stats` with fixture tests; refactor `compare.ts` to reuse it.
- Extend `PlayerPage.test.tsx`; add `accents` and `playerTotals` tests.

### Out of Scope
- Motion polish beyond composing existing presets (Phase 6 / #20).
- Splash (#17) and Compare (#19) pages.
- Any new theme tokens or design-system primitives.
- Real snapshot sync (#8) — the page continues to read committed fixture snapshots.

## Acceptance Criteria

1. Hero header shows the display name large with a per-player accent assigned by config order
   (tokens, not hardcoded per key) and an `aria-hidden` animated backdrop that honors reduced
   motion.
2. A summary row of `StatTile` count-ups shows games played, total trophies, and platinum
   count, sourced from `src/stats` exports (no ad-hoc stat logic in `site/`).
3. The four sections (Recent games, Most played, Most trophies, Platinum games) render through
   `GameSection` with a stagger between sections.
4. Platinum rows use `TrophyBadge` styling for the known tier.
5. Unknown-player and no-snapshot fallbacks are styled in the same language and keep their
   accessible semantics (h1 present; no level-2 headings in the fallbacks).
6. `PlayerPage.test.tsx` passes with section headings and game rows still located by
   role/name, extended to assert the final stat-tile numbers.
7. `pnpm --filter site lint | typecheck | test | build` are green — and the root package's
   `pnpm lint | typecheck | test | build` too.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Stats layer: promote `playerTotals` to `src/stats`, refactor `compare.ts`, add fixture tests | `src/stats/`, `test/` |
| 2 | Site: hero header, stat-tile summary row, section stagger, `TrophyBadge` platinum metric, restyled fallbacks, accent helper | `site/src/pages/`, `site/src/config/`, `site/src/components/GameSection.tsx` |
| 3 | Tests & gate: extend `PlayerPage.test.tsx`, add accents test, run both packages' gates | `site/src/`, both packages |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `compare.ts` refactor alters `comparePlayers` output | Med | Pure move of `totals()` → `playerTotals()`, body unchanged; existing compare tests gate it. |
| Widening `GameEntry.metric` to `ReactNode` breaks a consumer | Low | `string ⊂ ReactNode`; the three non-platinum sections and their `getByText` tests are unaffected; grep consumers first. |
| Stat-tile values (`2`, `4`) collide with other text nodes in tests | Low | Scope each value query to its labelled tile, not a bare `getByText`. |
| Ambient backdrop animates under reduced motion | Med (a11y) | Gate drift/glow on `useReducedMotion()`, per the `HeroIllustration` precedent; backdrop is `aria-hidden`. |
| Count-up renders `0` in jsdom | Low | `AnimatedNumber` renders the final value when it can't animate; tests assert final numbers only. |

## Effort Estimate

**Overall:** Small (1–2 days).

| Phase | Estimate |
|---|---|
| Phase 1 — stats layer + tests | ~0.5 day |
| Phase 2 — site redesign | ~1 day |
| Phase 3 — tests & gate | ~0.5 day |

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement phase by phase.
3. After implementation is merged, delete `.agents/issue-planner/18/` and close the issue.
