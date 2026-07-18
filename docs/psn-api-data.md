# PSN API — Available Data Reference

A reference for milestone planning: what data the PlayStation Network API (via
[`psn-api`](https://github.com/achievements-app/psn-api)) can provide, what this
repo currently ingests, and what is available but not yet captured.

> **Scope note:** All PSN access in this repo goes through `psn-api` and is
> confined to `src/psn/`. Three endpoints are called today (`src/psn/fetch.ts`);
> the rest of this doc marks what is *available for future milestones* vs. what is
> *captured now*. Field lists for uncalled endpoints reflect `psn-api`'s documented
> responses and should be re-verified against the library before building on them.

---

## Authentication

PSN has no official public API — `psn-api` authenticates with an **NPSSO token**
(64-char cookie from a logged-in playstation.com session) and exchanges it for
short-lived OAuth tokens.

| Step | `psn-api` function | Notes |
|---|---|---|
| NPSSO → access code | `exchangeNpssoForAccessCode` | NPSSO from `ca.account.sony.com/api/v1/ssocookie` |
| Access code → tokens | `exchangeAccessCodeForAuthTokens` | Returns `accessToken` (+ refresh token, expiry) |
| Refresh | `exchangeRefreshTokenForAuthTokens` | **Not used today** — we re-auth from NPSSO each sync |

- NPSSO tokens expire (~months) and must be refreshed manually from a browser
  session. This repo stores them per player in `.env` (`NPSSO_DAD`, `NPSSO_BRAIDAN`).
- The OAuth `accessToken` is short-lived; a refresh token exists but is currently
  unused (**future milestone opportunity:** long-running sync without re-pasting NPSSO).

---

## 1. Played Games — `getUserPlayedGames` ✅ *captured*

Paginated play-history list (this repo pages at 200/request).

### Captured today → `PlayedTitle` (`src/psn/models.ts`)

| Field | Type | Meaning |
|---|---|---|
| `titleId` | string | e.g. `PPSA01325_00` |
| `name` | string | Localized title name |
| `imageUrl` | string | Cover art URL |
| `category` | string | `ps5_native_game`, `ps4_game`, … |
| `playCount` | number | Number of play sessions |
| `playDurationIso` | string | ISO-8601 duration, e.g. `PT82H14M9S` |
| `playDurationMinutes` | number | Parsed to minutes |
| `firstPlayed` | ISO datetime | First-ever play |
| `lastPlayed` | ISO datetime | Most recent play |

### Available but **dropped** in mapping (`RawPlayedTitle`)

| Field | Meaning / future use |
|---|---|
| `service` | e.g. `none_purchased` — ownership/entitlement signal |
| `concept` | Concept id, canonical name, and media bundle (cross-platform grouping) |
| `media` | Richer audios/videos/images than the single `imageUrl` |
| `localizedName` / `localizedImageUrl` | Locale-specific variants |

> **Note:** This endpoint gives **current cumulative** playtime only — there is no
> per-day history from PSN. All trend/pace analytics depend on *this repo* snapshotting
> over time (see `data/<player>/<date>.json`).

---

## 2. Trophy Titles — `getUserTitles` ✅ *captured*

Paginated per-game trophy standing (this repo pages at 250/request). Aggregated
**per title**, not per individual trophy.

### Captured today → `TrophyTitleStats` (`src/psn/models.ts`)

| Field | Type | Meaning |
|---|---|---|
| `npCommunicationId` | string | e.g. `NPWR22859_00` |
| `name` | string | Trophy set / game name |
| `platform` | string | PS4 / PS5 |
| `iconUrl` | string | Trophy set icon |
| `defined` | `TrophyCounts` | Total trophies that exist, per tier (bronze/silver/gold/platinum) |
| `earned` | `TrophyCounts` | Trophies earned, per tier |
| `earnedTotal` | number | Sum of earned tiers (derived) |
| `progress` | number | 0–100 completion (as reported by PSN) |
| `hasPlatinum` | boolean | Derived (`earned.platinum > 0`) |
| `lastTrophyAt` | ISO datetime | `lastUpdatedDateTime` — most recent trophy activity for the title |

### Available but **dropped** in mapping (`PsnTrophyTitle`)

| Field | Meaning / future use |
|---|---|
| `npServiceName` | `trophy` (PS3/PS4/Vita) vs `trophy2` (PS5) — needed for detail lookups |
| `trophySetVersion` | Trophy set version (DLC additions bump it) |
| `hasTrophyGroups` | Whether the title has DLC/base trophy groups |
| `hiddenFlag` | Hidden-title flag |

---

## 3. Profile — `getProfileFromAccountId` ✅ *captured (minimally)*

Only used to resolve `onlineId` for non-`me` accounts. `psn-api` returns much more
than we keep.

### Captured today → `PlayerIdentity`
- `onlineId` (only when fetching a specific `accountId`, not `me`)

### Available but **dropped**
Avatar URLs, about-me / languages, PlayStation Plus status, friend relationship,
`isOfficiallyVerified`, presence hints, etc.

---

## Endpoints available for FUTURE milestones (not yet used)

These are exposed by `psn-api` but **not called** anywhere in this repo. They are
the main expansion surface for future analytics milestones.

| Endpoint | What it adds | Milestone idea |
|---|---|---|
| `getUserTrophiesEarnedForTitle` | **Per-trophy** earned state incl. **`earnedDateTime`** and **rarity** (`trophyEarnedRate`, `trophyRare`) | True trophy timelines & "trophies earned on date X" without waiting for snapshot accumulation; rarity/prestige scoring |
| `getTitleTrophies` | Full **definition** of every trophy in a title: name, detail, icon, tier, hidden flag | Show individual trophy names/descriptions; "next trophy to chase" |
| `getTitleTrophyGroups` | Base-game vs **DLC groups** breakdown | Per-DLC completion; separate base vs. add-on progress |
| `getUserTrophyGroupEarningsForTitle` | User earnings **per group** | DLC-level completion scoreboard |
| `getUserTrophyProfileSummary` | Account-wide **trophy level**, tier, and rolled-up earned totals | Headline "trophy level" stat; account-level leaderboards |
| `getBasicPresence` | Online/offline + currently-playing | Live "now playing" indicator (real-time, not snapshot-based) |
| `getProfileFromAccountId` (full) | Avatars, PS Plus status, about-me | Richer player headers/cards |
| Refresh-token flow | Long-lived auth without re-pasting NPSSO | Unattended/scheduled sync |

### Key gap worth noting for planning
The current snapshot stores only **title-level** trophy aggregates + a single
`lastTrophyAt` per title. **Individual trophy earn dates are NOT captured.** Any
milestone wanting a real trophy-earning timeline (independent of snapshot cadence)
needs `getUserTrophiesEarnedForTitle` **and** a `PlayerSnapshot` `schemaVersion` bump
to store per-trophy rows. That is deliberately out of scope for the snapshot-delta
approach in #7.

---

## Data-shape summary (what's on disk today)

```
PlayerSnapshot
├── schemaVersion: 1
├── player: { key, displayName, accountId?, onlineId? }
├── capturedAt: ISO datetime          ← the snapshot timestamp (trend x-axis)
├── playedTitles: PlayedTitle[]        ← sorted by titleId
└── trophyTitles: TrophyTitleStats[]   ← sorted by npCommunicationId
```

Snapshots are committed per player per day (`data/<player>/<YYYY-MM-DD>.json` +
`latest.json`), which is what turns PSN's point-in-time totals into a historical
dataset for trend analytics.
