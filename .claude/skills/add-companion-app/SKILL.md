---
name: add-companion-app
description: Add a new game to the site's Together section (/together) as a companion app — the interactive map, guide tables, quick reference, help sites, videos and notes for one title. Use this whenever someone wants to add a game to Together, add or write a companion app, put a title on the companion grid, or fill in / correct an existing companion's content. Also use it when someone names a game they play together and asks for a reference page, cheat sheet, or second-screen page for it, even if they never say the word "companion".
license: MIT
---

# Add a Companion App

## Overview

The **Together** section (`/together`) is a grid of the games both players play side
by side. Each tile opens that title's companion app: the material worth having on a
second screen mid-session.

The mechanics are deliberately trivial — one content file plus one line in a
registry, no component or route changes. So this skill spends almost all of its
attention on the two things that actually go wrong:

1. **Attaching the wrong PSN data**, which silently shows another game's trophies.
2. **Writing content from memory**, which produces a page that reads authoritative
   and is quietly wrong.

**Announce at start:** "I'm using the `add-companion-app` skill."

---

## Step 1 — Confirm the game belongs here

Together is for games played *as a pair*, and the stats module is built around that.
A title only one player has touched will render "Not in this library yet" on the
other's card, which looks broken rather than informative.

The script in Step 2 answers this as a side effect — it prints which players have
the title. If only one does, say so and ask whether to add it anyway before spending
effort on content.

---

## Step 2 — Nail `psnTitleNames` before anything else

This is the field that decides which numbers appear on the page. PSN spells one game
several ways (a played title, a separate trophy list, different store SKUs), and
sequels share a prefix with their predecessors — so a plausible-looking guess can
attach **the previous game's trophy list** to a sequel. That mistake is invisible on
the page: it just shows confident, wrong numbers.

Run the bundled script from the repo root:

```bash
node .claude/skills/add-companion-app/scripts/find-title-names.mjs "<part of the name>"
```

It prints every matching played title and trophy list with playtime, session counts
and dates, then works out which pairings are *possible*. A trophy cannot be earned
before its game was first played, so any trophy list whose last trophy predates a
title's first session is ruled out mechanically — the script marks those IMPOSSIBLE.

Read the output and pick the names that are this game. Include every spelling it goes
by; matching ignores case and trademark symbols, so list each distinct spelling once.

**A game with no trophy list at all is normal**, not a bug to work around — an
early-access PS5 title often has none, so the page will honestly show zero trophies.
When that happens, say so in a note (see Step 5) so the zero doesn't read as a defect.

---

## Step 3 — Research the content, don't recall it

Write content from sources you have actually consulted in this session. Recalled
detail about a specific game's items, tiers, and mechanics is exactly the kind of
thing that is plausible and wrong, and a companion page is consulted mid-session by
someone who will act on it.

Search for the game's community wiki, a structured guide site, its official patch
notes, and interactive maps. Read the pages where you can; where network access
blocks fetching, search results still establish which sources exist and what they
say, and the notes should record that the check was that shallow.

Two things to carry into the file:

- A short header comment naming what you checked the content against and when.
  Games in early access move, and the next person needs to know how stale this is.
- Anything you could not verify goes in **Our notes** as an open question, not into
  a reference table phrased as fact.

---

## Step 4 — Write the content file

Create `site/src/companions/<slug>.ts` exporting a `Companion`. The full shape lives
in `site/src/companions/types.ts`; `grounded-2.ts` is a worked example of every
module. Only `slug`, `name`, `tagline`, `blurb` and `psnTitleNames` are required —
every module below is optional, and the page renders exactly the ones present.

The `slug` is the URL segment (`/together/<slug>`), so keep it lowercase and
hyphenated, and match the filename to it.

| Module | Field | What earns its place here |
|---|---|---|
| Quick reference | `quickReference` | The one-screen cheat sheet: grouped term/detail pairs you'd otherwise re-look-up every session |
| Map | `map` | Zones and pins for *your own* places — bases, resource runs, things to avoid |
| Guides | `guides` | Sortable tables: gear, materials, anything with rows worth comparing |
| Help sites | `links` | Outbound references, each with one line on why it's worth opening |
| Videos | `videos` | YouTube ids only (the `v=` parameter), not full URLs |
| Our notes | `notes` | House rules, plans, open questions — the part no wiki has |

The stats module renders automatically from the snapshots; there is no field for it.

**Aim for what gets consulted mid-session.** A companion that mirrors the wiki is
worse than the wiki. The parts that justify the page are the ones the wiki cannot
have: which gear *you* have built, where *your* base is, what you agreed to do next.
Shipping a title with just links and notes is a perfectly good first version.

### Content rules that are not negotiable

- **No game art, box art, logos or in-game map images.** Tiles are text and shape
  glyphs; the map is an original abstract drawing. This is the same
  no-trademarked-assets rule the rest of the site follows.
- **Name colours by role, never by value.** Map zones and pin categories take a
  `tone` of `resource`, `creature`, `landmark` or `base`, which
  `site/src/config/tones.ts` resolves to theme tokens. A content file never contains
  a colour.
- **Say what your content is.** The map caption must make clear the drawing is your
  own sketch and not the game's map, because a hand-drawn map beside real game
  names otherwise reads as authoritative geography.

### Map coordinates

Zone and pin `x`/`y`/`rx`/`ry` are percentages of the map box, 0–100. Zone labels
render just inside the top edge of their blob, so pins clustered near a zone's centre
won't collide with them. Keep pins a few percent clear of each other; at six or so
pins per map the labels stay readable.

---

## Step 5 — Register it

Add the import and the array entry in `site/src/companions/index.ts`:

```ts
import { yourGame } from './your-game';

export const companions: Companion[] = [grounded2, yourGame];
```

Array order is tile order. Nothing else changes — the grid, the routes, the section
accents and the existing tests all derive from this array.

---

## Step 6 — Verify, including with your eyes

Run the gate from the repo root:

```bash
pnpm --filter site lint && pnpm --filter site typecheck && \
  pnpm --filter site test && pnpm --filter site build
```

The existing suites already cover the new title: the companion page tests render
whatever the registry's first entry declares, and the Together page test asserts a
tile per registered companion. A new game needs a new test only when it introduces a
new *module type*, which means a component change and a component test alongside it.

Then look at the page. Layout problems here are visual — colliding map labels, a
table too wide on a phone, a tile whose tagline wraps badly — and no assertion
catches them:

```bash
pnpm --filter site preview   # after the build above, then open /together/<slug>
```

Check it at phone width too. The nav and the tables are the parts that break first.

CI also runs a browser suite (`pnpm --filter site test:e2e`) that drives the real
build, including the Together grid and a companion's map filtering. It needs a
Playwright Chromium binary, so it may not run everywhere — but if you touched map
content, run it, because it is the only check that exercises pins as real elements.

---

## Step 7 — Commit

One commit, message naming the game and where the content came from. Follow the
repo's PR convention in `AGENTS.md`: **What was done / Why it was done / How to
manually test**, with the "how to test" section giving a reviewer the URL to open and
what they should see.

If you deferred anything — a module you left empty, a fact you could not confirm —
the repo rule is that it gets a GitHub issue immediately, not just a prose note.
