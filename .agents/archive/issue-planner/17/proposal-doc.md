# Proposal — Phase 3: Splash page — hero illustration & animated landing (#17)

## Executive Summary

The splash page is currently a bare `<h1>`, a marked placeholder SVG, and a plain
list of links. This work turns it into the site's front door: a real custom
father-&-son hero illustration (silhouetted players with controllers plus abstract
PlayStation-shape confetti accents), an animated title composed from the
configured player names, large per-player portal cards, and a VS-styled compare
call-to-action — all entering with a single staggered hero sequence.

The approach is deliberately additive over the existing foundation: it composes
the Phase 2 component kit (`GlassCard`) and the shared motion presets (`fadeRise`,
`staggerChildren`, `glowPulse`) rather than introducing new primitives or bespoke
keyframes, and it keeps player names and card copy **derived from
`psn.config.json`** rather than hardcoded. It is a purely presentational,
`site/`-only change with no data-layer, schema, dependency, or security impact,
so it lands as one reviewable PR.

## Scope

### In Scope
- New `HeroIllustration` component replacing `PlaceholderGraphic` (which is deleted).
- Config-derived animated title treatment for the site headline.
- One large glass portal card per configured player, each linking to its player page.
- A VS-styled compare CTA linking to the compare route.
- Page-level staggered entrance choreography (hero → title → cards → CTA).
- Updated + extended `SplashPage` tests and a new `HeroIllustration` test.

### Out of Scope
- Broader motion polish across the site (tracked as #20, Phase 6).
- Player page (#18) and Compare page (#19) redesigns.
- Any editorial per-player tagline/invitation field in config (deferred; the
  invitation line is derived from the display name for now).

## Acceptance Criteria

1. `PlaceholderGraphic` is replaced by a custom `HeroIllustration`: two silhouetted
   players with controllers on the dark surface, PS-shape confetti accents in the
   shape token colors, and a subtle idle float/glow from the shared presets, with a
   meaningful `role="img"` + `aria-label`.
2. `site/src/components/PlaceholderGraphic.tsx` and its `SplashPage` usage are deleted.
3. The headline "Dad & Braidan's PlayStation Stats" is an animated, staggered
   fade-rise treatment composed from `staggerChildren`/`fadeRise`, with player
   names derived from config (no hardcoding, no bespoke keyframes).
4. One large `GlassCard` portal card per configured player shows the display name
   and a derived invitation line, with hover lift + glow, linking to `playerPath(key)`.
5. A compare CTA styled as a VS banner links to `COMPARE_PATH`, with accessible
   name exactly "Compare".
6. The whole page enters with a staggered sequence: hero → title → cards → CTA.
7. `SplashPage.test.tsx` passes and is extended (hero img accessible name, one link
   per player, compare link); a new `HeroIllustration.test.tsx` covers the component.
8. `pnpm --filter site lint`, `typecheck`, `test`, and `build` all pass.

## Implementation Phases

Single phase (one PR); the sub-steps below are ordered for reviewability, not
staged across PRs.

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | New `HeroIllustration` component + test | `site/src/components/` |
| 2 | Rewrite `SplashPage` (title, portal cards, compare CTA, choreography) | `site/src/pages/` |
| 3 | Delete `PlaceholderGraphic` | `site/src/components/` |
| 4 | Extend `SplashPage` tests | `site/src/pages/` |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Compare link accessible name becomes "VS Compare", breaking the exact-name test | Med | Keep "VS" decorative (`aria-hidden`) / use `aria-label="Compare"`. |
| Portal card wrapping name + invitation in one link changes the matched accessible name | Med | Test matches a substring regex; also assert exactly one link per player. |
| Title stagger fragments the heading's accessible name | Low | Keep all text in one `<h1>`, animate inner spans. |
| Idle float/glow ignores reduced-motion preference | Low | Rely on app-level `<MotionConfig reducedMotion="user">` + preset variants. |
| Title helper assumes exactly two players | Low | Join all display names with " & " and append possessive; degrades for 1/N. |

## Effort Estimate

**Overall:** Small (1–2 days) — one package, no data/config/schema/security work;
most of the effort is the SVG illustration craft and the animation choreography.

| Phase | Estimate |
|---|---|
| 1 — Hero illustration + test | ~0.5 day |
| 2 — Splash rewrite + choreography | ~0.5–1 day |
| 3 — Delete placeholder | trivial |
| 4 — Extend tests | ~0.25 day |

## Next Steps

1. Review and approve this proposal.
2. Follow `task-doc.md` to implement (single PR).
3. After the PR merges, delete `.agents/issue-planner/17/` and close the issue.
