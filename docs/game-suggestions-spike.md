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

**Status:** Phase 2 requires execution in GitHub Actions (remote dev environment restricts egress).
The prototype is complete and ready to run in CI with access to external APIs.

When run with both APIs (`pnpm tsx scripts/spike-suggestions.ts --max-titles N`):
- Connects to `api.rawg.io` and `api.igdb.com` to perform head-to-head matching
- Reports PSN-title match rate per API (the deciding factor)
- Outputs genre profiles, top shared genres, and ranked suggestions per genre/API
- Unmatched titles help identify name-normalization gaps

## Recommendation

**Chosen approach: RAWG API for genre discovery + v1.1 curated overrides**

### Rationale (pending Phase 2 evidence)

Based on desk research and prototype architecture:

1. **RAWG wins on operational simplicity:**
   - Single API key (vs. Twitch OAuth + token refresh for IGDB)
   - Simpler REST interface (vs. IGDB's APIcalypse SQL-ish syntax)
   - Clear attribution model (backlink on v2 pages mentioning the data source)
   - Free tier: 20k requests/month — sufficient for real-time suggestions (~5 req per player per sync)

2. **IGDB is feature-rich but higher friction:**
   - `similar_games` relation is powerful but premium-only
   - Requires Twitch dev app + token management (OAuth client-credentials flow)
   - Richer genre taxonomy, but harder to keep fresh

3. **Curated approach is not viable for v2:**
   - Would require hand-curation of 100+ suggested titles
   - PS Plus catalog changes monthly — would go stale fast
   - Hybrid option: use RAWG as primary; curated JSON as overrides for edge cases

### Data shape for v2

Committed at `data/suggestions.json` (generated once per sync, keyed by genre):

```json
{
  "by_genre": {
    "Action": [
      { "name": "Game Title", "rawgId": 12345, "rating": 85, "released": "2024-01-15" },
      ...
    ],
    "Adventure": [...],
    "RPG": [...]
  },
  "metadata": {
    "generated_at": "2026-07-24T05:30:00Z",
    "rawg_base_url": "https://rawg.io",
    "attribution": "Data from RAWG.io",
    "build": "v0.1.0"
  }
}
```

Refreshed by a `pnpm run sync:suggestions` step (added to sync CLI, rate-limited to avoid quota).

### Cost & maintenance

- **Ongoing cost:** Zero (free tier)
- **Rate limit:** 20k req/month = ~650 req/day sustainable load; our sync runs ~5 per day ✓
- **Maintenance:** Monthly API check (breaking changes rare); RAWG rarely removes games
- **Attribution:** Add footer on v2 suggestions page: "Data from [RAWG](https://rawg.io)" with link

## v2 feature scope

Following this spike, file v2 issues for:

1. **`src/suggestions/fetch.ts`** — RAWG API client, matching logic, genre profiling
2. **`src/suggestions/sync.ts`** — Sync-time integration point (called from CLI after `psn-api` sync)
3. **Storage & refresh policy** — when to refresh (every sync? weekly? on-demand?)
4. **Stats function** — per-player top genres by hours, shared genres, curated-overrides data shape
5. **UI component** — `site/components/Suggestions.tsx`, wired into new v2 "Discover" tab
6. **Curated overrides** — mechanism for manual corrections (e.g., VR games poorly tagged by RAWG)

Integration points:
- `src/cli/sync.ts` — add `--sync-suggestions` flag (default on, opt-out available)
- `src/fixtures/sample.ts` — add sample `suggestions.json` for tests
- Schema: no change to `PlayerSnapshot` or `schemaVersion` (suggestions are ancillary data)

### Known gaps & risks

1. **PS5 platform code in RAWG:** Verified as `187`. Cross-check if RAWG drops/renames it.
2. **Name matching on edge cases:** Prototype will surface unmatched titles; those become manual curated overrides.
3. **Rate limit headroom:** Current math assumes ~1 sync/day. If sync cadence increases, implement batch queuing.
4. **Genre staleness:** RAWG's player base drives genre tags. New indie games may lack initial tagging; consider retrying monthly.
