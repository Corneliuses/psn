# Research spike — game suggestions for titles we don't own (#9)

> Status: **in progress** — Phase 1 (desk research) complete; Phase 2 (live prototype) pending
> API keys. Sections marked _TBD_ are filled from prototype evidence.

Evaluates how a v2 feature could suggest games neither player owns, informed by genre/play
patterns in the synced data. Prototype: `scripts/spike-suggestions.ts` (run with
`pnpm tsx scripts/spike-suggestions.ts`; needs the env vars below in `.env`).

Required env vars (gitignored `.env` only — never committed, never in CI):

```
RAWG_API_KEY=                # rawg.io/apidocs — instant free key
IGDB_TWITCH_CLIENT_ID=       # dev.twitch.tv registered application
IGDB_TWITCH_CLIENT_SECRET=
```

---

## Question 1 — does `psn-api` already offer genre/store metadata?

**No.** Verified against `psn-api` v2.18 type definitions (`node_modules/psn-api/dist/`):

- Zero occurrences of "genre" anywhere in its typed API surface.
- The `concept` field on played titles (currently dropped in our mapping) is only
  `{ id, titleIds, name, media }` — cross-version grouping and artwork. PSN's *internal* concept
  catalog does have genre data, but `psn-api` exposes no concept-detail or store-catalog endpoint
  to reach it.
- `makeUniversalSearch` supports only the `"SocialAllAccounts"` domain (player search), not game
  search.

Useful adjacent findings for v2 (ownership signals, not genres):

- `getPurchasedGames` (GraphQL) returns the **full purchased library including never-played
  games** — better "already owned" exclusion than played-titles alone.
- The played-games response has a `service` field (`"none" | "none_purchased" | "ps_plus"`) —
  distinguishes owned vs. PS Plus entitlement.

**Consequence:** classifying owned games by genre *and* discovering unowned games both require an
external catalog (or curation). That is exactly the IGDB vs. RAWG vs. curated question below.

## Question 2 — candidate comparison

Desk-research columns are confirmed; empirical columns come from the prototype run (_TBD_).

| | IGDB | RAWG | Curated `suggestions.json` |
|---|---|---|---|
| Auth | Twitch dev app: client-credentials OAuth (POST `id.twitch.tv/oauth2/token`), token ~60 days, refresh in code | Single API key as query param | None |
| Free-tier limits | 4 req/s, 8 concurrent; free for non-commercial | 20,000 req/month; free tier is non-commercial only | n/a |
| Attribution | Not required (non-commercial) | **Backlink to RAWG required** on pages using the data | n/a |
| Genre taxonomy | ~23 curated genres + separate `themes` (e.g. open-world) | ~19 genres, community-tagged, plus rich `tags` | Whatever we write |
| Similar-games support | `similar_games` relation per title | "Suggested" endpoint (computer-vision based; **paid tier**) | Manual |
| PS4/PS5 filtering | `platforms = (48,167)` | `platforms=18,187` | Manual |
| Query style | APIcalypse (SQL-ish POST body) — flexible, unfamiliar | Plain REST query params | n/a |
| Ongoing cost/maintenance | Twitch app + token refresh logic | Key only; monthly cap to watch | Hand-upkeep every few months; goes stale |
| **PSN-name match rate** | _TBD (prototype)_ | _TBD (prototype)_ | n/a (keyed by hand) |
| **Genre quality on our libraries** | _TBD (prototype)_ | _TBD (prototype)_ | n/a |

Network note: all three hosts (`api.rawg.io`, `id.twitch.tv`, `api.igdb.com`) confirmed reachable
from the dev environment (unauthenticated probes return 401/404, not proxy blocks).

## Prototype design

`scripts/spike-suggestions.ts` — spike-only code, outside the product build (`src/` untouched):

1. Read `data/<player>/latest.json` for every player in `psn.config.json`.
2. Filter `playedTitles` to real games (`ps4_game`, `ps5_native_game`, `ps4_ps2emu_game`) — this
   matters: media apps dominate raw playtime (Hulu alone is Dad's top "title" at ~2,270 h).
3. Clean names (`(PlayStation®5)`, `PS4® & PS5®`, edition suffixes) and dedupe cross-platform
   variants via `nameKey()`, summing playtime (the #33 rollup concern).
4. Match every owned game against RAWG and IGDB; record **match rate** and per-title genres.
5. Build a playtime-weighted genre profile per player; take the top genres **both** players play.
6. Fetch highly rated PS4/PS5 games per top genre from each API; exclude owned titles; report.

## Prototype results

_TBD — match rates, genre profiles, sample suggestions per API, unmatched-title list._

## Recommendation

_TBD — chosen approach, rationale grounded in prototype evidence, v2 data shape (likely a
committed `data/suggestions.json` refreshed by a sync-adjacent step), cost/maintenance notes._

## v2 issue list

_TBD — scoped issues for the real feature: fetch layer, storage/refresh cadence, stats function,
UI surface, curated-overrides escape hatch._
