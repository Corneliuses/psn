# psn — father & son PlayStation stats

A stats site for two players — Dad and Braidan — tracking what we play and the trophies we earn. Splash page with links to each player's stats (recent games, most played, trophy leaders, platinums) and a head-to-head comparison. Site UI is under construction; the data layer below is live.

## How it works

```
PSN API ──> pnpm sync ──> data/<player>/<date>.json ──> src/stats ──> site (coming)
            (psn-api)      committed snapshots           pure functions
```

- **Sync** (`src/psn`, `src/cli`): authenticates with PSN via NPSSO tokens and pulls each player's played titles (play time, play counts, last played) and trophy titles (earned tiers, platinums, progress).
- **Snapshots** (`data/`): one JSON per player per day plus `latest.json`, committed to git — the history doubles as the dataset for trend analytics later.
- **Stats** (`src/stats`): pure functions over snapshots — recent games, most played, trophy leaders, platinum list, and a full player-vs-player comparison. The future UI reads only this layer.

## Setup

```bash
pnpm install
cp .env.example .env    # then fill in NPSSO tokens (see below)
pnpm sync               # pull real data for all configured players
pnpm sync --dry-run     # exercise the pipeline with sample data, no credentials
```

**Getting an NPSSO token**: log in at [playstation.com](https://www.playstation.com), then visit [ca.account.sony.com/api/v1/ssocookie](https://ca.account.sony.com/api/v1/ssocookie) and copy the `npsso` value into `.env`. Tokens last ~2 months; when sync starts failing with an auth error naming your env var, grab a fresh one.

Players are declared in [`psn.config.json`](./psn.config.json). Each player either signs in with their own token (`mode: "npsso"`) or is fetched through another account's session (`mode: "friend"`, requires friendship and open privacy settings).

## Commands

| Purpose | Command |
|---|---|
| Lint / typecheck / test / build | `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` |
| Sync all players | `pnpm sync` |
| Sync one player | `pnpm sync --player braidan` |
| Credential-free pipeline check | `pnpm sync --dry-run` |

## Built with agentic-config

This repo is a living, public consumer of [Corneliuses/agentic-config](https://github.com/Corneliuses/agentic-config) — a library of harness-agnostic agent skills. The skills are installed under [`.claude/skills/`](./.claude/skills), the permission preset backs [`.claude/settings.json`](./.claude/settings.json), and [`AGENTS.md`](./AGENTS.md) was generated via its `repo-setup` skill. Development happens *through* the skills, and the artifacts are public:

| Skill | Artifact |
|---|---|
| issue drafting (refiner-style structure) | [#1 PSN data layer](https://github.com/Corneliuses/psn/issues/1) · [#2 snapshot store + sync CLI](https://github.com/Corneliuses/psn/issues/2) · [#3 derived stats](https://github.com/Corneliuses/psn/issues/3) |
| `repo-setup` | [AGENTS.md](./AGENTS.md) |
| `milestone-planner` | v1 site — [#4](https://github.com/Corneliuses/psn/issues/4) scaffold+splash · [#5](https://github.com/Corneliuses/psn/issues/5) player page · [#6](https://github.com/Corneliuses/psn/issues/6) compare page · [#7](https://github.com/Corneliuses/psn/issues/7) analytics · [#8](https://github.com/Corneliuses/psn/issues/8) auto-sync · [#9](https://github.com/Corneliuses/psn/issues/9) suggestions spike · [#10](https://github.com/Corneliuses/psn/issues/10) docs |
| `issue-planner` / `vibe-coding` | per-feature plans and PRs as the site gets built (future sessions) |

Everything above was produced by an AI agent executing those skills against this repo — nothing staged. Sample data in `src/fixtures/` is clearly fake and used only for tests and `--dry-run`; committed snapshots in `data/` are real.

## Privacy

Gaming stats are low-sensitivity, but this is a public repo involving a kid's data, so: display names are what appear in `psn.config.json` (first name only), NPSSO tokens are never committed, and nothing beyond game/trophy/playtime data is stored.
