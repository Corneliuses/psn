# Design Doc — Phase 6: Research spike — game suggestions for titles we don't own (#9)

## Overview

Time-boxed research spike to determine how to suggest games neither player owns, informed by
genre/play patterns in the real synced data. The deliverable is a written recommendation
(`docs/game-suggestions-spike.md`) plus a small committed prototype script — **no product code**.
The real feature ships in a v2 milestone scoped by this spike's output.

## Acceptance Criteria

The issue lists tasks rather than formal ACs; confirmed with the user and formalized as:

- [ ] AC1 — All three catalog options are evaluated with evidence: **IGDB** and **RAWG** via live
  probes (user is providing both keys), **curated `suggestions.json`** via a worked example of its
  data shape and upkeep cost.
- [ ] AC2 — The "does `psn-api` expose genre/store metadata?" question is answered explicitly in
  the doc, including whether the dropped `concept` field on `RawPlayedTitle` (or any PSN catalog
  endpoint reachable through `psn-api`) carries genre data.
- [ ] AC3 — One candidate is prototyped end-to-end: real `data/*/latest.json` in → genre profile →
  suggestions of unowned games out, for at least 3 genres derived from actual play data.
- [ ] AC4 — `docs/game-suggestions-spike.md` exists with: chosen approach + rationale, rough data
  shape for v2, a scoped v2 issue list, and cost/rate-limit/maintenance implications.
- [ ] AC5 — Prototype lives in `scripts/` (committed per user decision), reads keys from `.env`
  only, and no code lands in `src/` or `site/`. Root gate (`pnpm lint`, `pnpm typecheck`,
  `pnpm test`, `pnpm build`) stays green.

## Architecture & Data Model

### Data Layer

No changes to `PlayerSnapshot` or anything under `src/`. The prototype **reads** committed real
snapshots (`data/dad/latest.json`: 257 played titles; `data/braidan/latest.json`: 115) and writes
nothing to `data/`.

Input realities the prototype must handle (verified against real snapshots):

- `PlayedTitle.category` is platform info, not genre: `ps4_game`, `ps5_native_game`,
  `ps4_ps2emu_game`, plus **non-game noise** (`ps5_native_media_app`, `ps4_videoservice_web_app`,
  `not_found`, `unknown`, …). Dad's top "title" by playtime is Hulu (2,272 h) — media apps must be
  filtered before any genre profiling.
- Title names carry PSN decorations — `"Grand Theft Auto V (PlayStation®5)"`,
  `"Grounded PS4® & PS5®"` — so matching against an external catalog needs `nameKey()`
  (`src/stats/names.ts`) **plus** stripping of platform suffixes.

### API / Service Layer

Nothing added to the product. The prototype calls external catalog APIs directly:

| Endpoint / Function | Type | Auth | Purpose |
|---|---|---|---|
| RAWG `GET /api/games` | HTTP (external) | `RAWG_API_KEY` query param | Match owned titles → genres; discover unowned games by genre |
| IGDB `POST /v4/games` etc. | HTTP (external) | Twitch OAuth client-credentials (`IGDB_TWITCH_CLIENT_ID`/`IGDB_TWITCH_CLIENT_SECRET`) | Same, plus `similar_games` relation |
| `scripts/spike-suggestions.ts` | Local CLI (tsx) | reads `.env` | End-to-end prototype: snapshots → genre profile → suggestions |

### UI Component Tree

None — research only. UI is explicitly a v2 concern; the doc's v2 issue list will include the UI
surface.

## Key Decisions

### Decision 1: Probe both hosted APIs live

**Options considered:**
- Option A: Desk-research only (no keys, mock shapes)
- Option B: RAWG live, IGDB on paper
- Option C: Both live

**Decision:** Option C — user is providing a RAWG key and IGDB (Twitch) credentials.
**Rationale:** The deciding factors between IGDB and RAWG — PSN-title-name match rate, genre
taxonomy quality, practical rate limits — can only be measured empirically against the real
libraries. A head-to-head on the same title set makes the recommendation evidence-based.

### Decision 2: Prototype location and gate exposure

**Options considered:**
- Option A: Scratch-only, embed findings in the doc
- Option B: Commit as `scripts/spike-suggestions.ts`, outside `src/`

**Decision:** Option B (user-confirmed).
**Rationale:** v2 starts from working code. Keeping it in `scripts/` (not `src/`, not exported,
not in the tsup build) honors the issue's "no product code" constraint and the one-way data-flow
rule in AGENTS.md. It is included in lint/typecheck (cheap, keeps it honest) but ships **no
Vitest suite** — the repo rule "no test may require credentials or network" would make tests
meaningless mocks for a throwaway pipeline.

### Decision 3: Genre source for *owned* titles vs. *suggestions*

Two distinct sub-problems the doc must keep separate:
1. **Classifying owned games by genre** — candidate sources: external API match, or possibly PSN's
   own concept catalog (spike task: check whether `RawPlayedTitle.concept` / any `psn-api` surface
   exposes genres; `docs/psn-api-data.md` shows `concept` is currently dropped in mapping).
2. **Discovering unowned games** — inherently needs an external catalog (PSN data only covers what
   was played); IGDB/RAWG/curated are the only candidates here.

The recommendation may legitimately mix sources (e.g. PSN concept genres for classification +
RAWG for discovery) — the spike decides.

## Security & Permissions

- New secrets: `RAWG_API_KEY`, `IGDB_TWITCH_CLIENT_ID`, `IGDB_TWITCH_CLIENT_SECRET` — `.env` only
  (gitignored), same handling rules as `NPSSO_*` (never commit, never log, never embed in error
  messages). `.env.example` gains commented placeholder lines.
- No NPSSO/PSN credentials needed — the prototype reads committed snapshots, never calls PSN.
- No auth/roles surface: static site, no change.

## Error Handling

Prototype-grade only: fail fast with a clear message on missing keys (mirroring `requireToken` in
`src/cli/sync.ts`), tolerate and **count** unmatched titles (match rate is itself a finding), and
respect API rate limits with simple delay/backoff. No retry sophistication — this is a spike.

## Testing Strategy

| Layer | Test Type | File(s) | Notes |
|---|---|---|---|
| Prototype script | None (manual runs) | `scripts/spike-suggestions.ts` | Requires network + keys; repo rule forbids such tests. Manual verification: run against real snapshots, sanity-check output. |
| Existing gate | Regression | root `pnpm lint`/`typecheck`/`test`/`build` | Must stay green; prototype must not break the build (excluded from tsup entry points). |

## Config Changes

- [ ] Schema / index changes — **none** (no `PlayerSnapshot` change; `schemaVersion` untouched)
- [ ] Access rule changes — none
- [ ] Environment variables — `RAWG_API_KEY`, `IGDB_TWITCH_CLIENT_ID`, `IGDB_TWITCH_CLIENT_SECRET`
  (local `.env` only; documented in `.env.example`; **not** added to CI)
- [ ] Dependency changes — none expected (Node 22 global `fetch`; `tsx` already present to run the
  script). If IGDB's protobuf option tempts a dep, use their JSON mode instead.

## Edge Cases & Risks

| Scenario | Impact | Mitigation |
|---|---|---|
| PSN title names don't match catalog entries (editions, "(PlayStation®5)" suffixes, LEGO®/™ marks) | High — bad match rate poisons the genre profile | Normalize via `nameKey()` + suffix stripping; report match rate per API as a headline finding; unmatched list goes in the doc |
| Media apps / non-game categories skew profile | Med | Filter to game categories (`ps4_game`, `ps5_native_game`, `ps4_ps2emu_game`) before profiling |
| Remote-env proxy blocks api.rawg.io / api.igdb.com / id.twitch.tv | Med — live probes are the point | Detect early with a 1-request smoke test per API; if blocked, fall back to user running the script locally and pasting output |
| Same game owned on PS4+PS5 counted twice in genre weights | Low | Dedupe by `nameKey` before weighting (same rollup concern as #33) |
| Rate limits (RAWG 20k/mo; IGDB 4 req/s) | Low at this scale (~370 titles worst case) | Batch queries where supported; small inter-request delay |
| Keys accidentally committed | High | `.env` is gitignored; keys never appear in output or doc; pre-commit diff check |
