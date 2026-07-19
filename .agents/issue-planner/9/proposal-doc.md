# Proposal — Phase 6: Research spike — game suggestions for titles we don't own (#9)

## Executive Summary

This spike answers one question: **what data source should power a v2 "games neither of us owns
but would probably like" feature** — IGDB (Twitch-authenticated), RAWG (key-authenticated), or a
manually curated `suggestions.json`? Rather than choosing from documentation alone, we run a live
head-to-head: a committed prototype script reads the real synced libraries (Dad: 257 played
titles, Braidan: 115), filters out non-game noise (media apps like Hulu dominate raw playtime),
builds a playtime-weighted genre profile per player, and asks both APIs for highly rated games in
the top shared genres that neither player owns. The measured PSN-title match rate and genre
quality of each API become the evidence for the recommendation.

Deliverables are `docs/game-suggestions-spike.md` (the recommendation, v2 data shape, and a
scoped v2 issue list) and `scripts/spike-suggestions.ts` (the working prototype, outside the
product build). No product code, no schema changes, no UI.

## Scope

### In Scope
- Desk + live evaluation of IGDB, RAWG, and a curated-JSON option (auth, rate limits, genre
  taxonomy, platform filtering, similar-games support, licensing)
- Explicit answer on whether `psn-api` / the dropped `concept` field offers genre metadata
- End-to-end prototype against real snapshots for ≥3 genres, committed to `scripts/`
- `docs/game-suggestions-spike.md` with recommendation + scoped v2 issue list
- `.env.example` placeholders for the three new (local-only) keys

### Out of Scope
- The actual suggestions feature: fetch layer in `src/`, storage, stats function, UI page —
  all v2, scoped by this spike's issue list
- Any `PlayerSnapshot` / `schemaVersion` change
- Adding keys or new steps to CI / the sync workflow
- Automated tests for the prototype (repo rule: no test may require credentials or network)

## Acceptance Criteria

1. IGDB and RAWG evaluated via live probes with real keys; curated option evaluated via a worked
   data shape and upkeep analysis.
2. The `psn-api` genre/store-metadata question is answered explicitly in the doc.
3. Prototype runs end-to-end on real `data/*/latest.json` for ≥3 genres derived from actual play
   data, reporting per-API match rates and suggestions excluding owned titles.
4. `docs/game-suggestions-spike.md` contains: chosen approach + rationale, rough v2 data shape,
   scoped v2 issue list, and cost/rate-limit/maintenance implications.
5. No code in `src/` or `site/`; keys live only in `.env`; root gate (lint, typecheck, test,
   build) green.

## Implementation Phases

| Phase | Description | Areas Affected |
|---|---|---|
| 1 | Desk research + psn-api metadata check; doc skeleton | `docs/` |
| 2 | Live prototype: snapshots → genre profile → suggestions via both APIs | `scripts/`, `.env.example` |
| 3 | Recommendation doc with evidence + v2 issue list | `docs/` |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Poor PSN-name → catalog match rate (editions, ® marks, platform suffixes) | High | `nameKey()` + suffix stripping; match rate is itself a reported finding, and a low rate strengthens the curated/hybrid option |
| Remote-env proxy blocks the external APIs | Med | 1-request smoke test up front; fallback: user runs the script locally with their keys |
| Media-app playtime skews genre profile | Med | Filter to game categories before profiling |
| PS4/PS5 duplicate entries double-count genre weight | Low | Dedupe by normalized name (same concern as #33) |
| Rate limits | Low | ~370 unique titles worst case; RAWG free tier is 20k req/mo, IGDB 4 req/s |

## Effort Estimate

**Overall:** Small (1–2 days)

| Phase | Estimate |
|---|---|
| Phase 1 | 0.25 day |
| Phase 2 | 0.5–1 day (dominated by name-matching iteration) |
| Phase 3 | 0.25 day |

## Next Steps

1. Review and approve this proposal.
2. Paste the RAWG key and IGDB (Twitch) client ID + secret into the session so Phase 2 can run
   (Phase 1 starts without them).
3. Follow `task-doc.md` phase by phase.
4. After the spike PR merges, delete `.agents/issue-planner/9/` and close #9; v2 issues get filed
   from the doc's issue list per the AGENTS.md deferred-work rule.
