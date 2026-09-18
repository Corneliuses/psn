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

Together is for games *both players play* — side by side or separately, both count.
The stats module is built around a pair, so a title only one player has touched
renders "Not in this library yet" on the other's card, which looks broken rather than
informative.

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

**That check only rules things out; it never rules anything in.** A long-running
game overlaps most of the library's history, so several trophy lists will come back
"consistent with" it and only one is right. Two cheap tests settle the rest:

- **The spelling.** A trophy list named exactly like the played title is almost
  always the same game. A remaster or a different entry in the series usually says so
  in its name.
- **The trophy count.** The snapshot's `defined` counts are printed as a total.
  Compare it against a published trophy guide for the game — an exact match is strong
  confirmation, and a mismatch means you have the wrong list. This is free and
  decisive, so do it whenever more than one list survives.

Matching is **exact after normalisation**, never prefix or substring: names are
compared case-insensitively with trademark symbols stripped, so `Marvel's Spider-Man`
and `Marvel's Spider-Man 2` are unrelated entries and listing one cannot pull in the
other. The risk is not over-matching, it is listing a name that belongs to a
different game. List each distinct spelling once.

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
notes, and interactive maps. Read the pages where you can.

**If you could not read a single primary source, stop and say so before writing the
file.** Network policy sometimes blocks every fetch, leaving only search-result
summaries. That is not a footnote — it is the difference between "I checked four
sources" and "I checked none", and it is invisible in the finished page, which will
read exactly as confident either way. Tell the user what you were able to reach and
let them decide whether to proceed, rather than shipping several hundred lines of
authoritative-sounding reference and mentioning the gap in a note at the end.

**When sources disagree on a number, do not average or silently pick.** Collectible
counts in particular vary between guides, often because one counts an item that
unlocks after the others. Put the figure the most sources agree on in the table, and
name the disagreement and the range in **Our notes**. A table cell has to contain
something; the note is what stops that something from being mistaken for settled.

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
| Map | `map` | Zones and pins for *your own* places — bases, resource runs, things to avoid. Optional, and often the right thing to skip for a game you play apart |
| Guides | `guides` | Sortable tables: gear, materials, anything with rows worth comparing |
| Help sites | `links` | Outbound references, each with one line on why it's worth opening |
| Videos | `videos` | YouTube ids only (the `v=` parameter), not full URLs — and see the sourcing rule below |
| Our notes | `notes` | House rules, plans, open questions — the part no wiki has |

The stats module renders automatically from the snapshots; there is no field for it.

**Aim for what gets consulted mid-session.** Most of a companion's factual content
comes from the wiki, and that is fine — the value is not in owning the facts, it is
in having *selected* them. A wiki page is exhaustive and wants reading; a module is
the five things you actually stop and look up, already compressed. If a module reads
like a page you could have linked instead, link it instead.

The personal layer is what no wiki can have, and it is where the page earns its keep
when it exists: which gear you have built, where your base is, what you agreed to do
next. Shipping a title with just links and notes is a perfectly good first version.

### Games the two players play apart

Together is "games both players play", which is not the same as "co-op games". A
single-player title both of you are working through separately belongs here, and the
stats module handles it fine — two columns, two sets of progress.

What does not survive is the map's premise. With no shared save there is no shared
base and no agreed route, so pins about "our places" have nothing to describe. Either
skip the map entirely, which costs the page nothing, or make it an orientation sketch
of the game's regions and say in the caption that it is exactly that. Do not invent
personal pins to fill it.

Shift the personal layer into the notes instead: where each player has got to, what
one of you found that the other should not miss, what you are racing each other on.
That is the shared thing in a game played apart.

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

### A video id you did not see is a wrong video

Never write a YouTube id from memory. An id is eleven characters with no redundancy,
so a recalled one is not approximately right — it either resolves to someone else's
video or to nothing, and the page gives no hint which. Only use ids you have seen in
a source during this session, and if that leaves you with one video or none, ship
that. The module disappears when the array is empty.

### Map geometry, and why pins collide

Zone and pin `x`/`y`/`rx`/`ry` are percentages of the map box, 0–100. Two properties
of that box decide whether a layout survives:

- **The box is 100 x 62.** A given percentage is about 1.6x more pixels horizontally
  than vertically, so pins that look evenly spaced by their numbers are closer
  together vertically than they appear on screen.
- **Pins are HTML pills sized by their text, and that text does not scale with the
  map.** A long pin name occupies a far larger share of the box on a phone than on a
  desktop, which is why a layout that looks clean at 1280px collides at 390px. Budget
  for your longest name, keep names short, and check the narrow width — see Step 6,
  which does this for you.

Zone labels render just inside the top edge of their blob rather than at its centre,
so pins near a zone's middle clear them. Six or so pins per map is about the limit.

---

## Step 5 — Register it

Add the import and the array entry in `site/src/companions/index.ts`:

```ts
import { yourGame } from './your-game';

export const companions: Companion[] = [grounded2, yourGame];
```

Name the export as the camelCase of the slug (`spider-man-2` gives `spiderMan2`), so
the file name, the slug and the symbol all read as the same thing.

Array order is tile order, and **append unless you specifically want the new game
featured first**. `CompanionPage.test.tsx` exercises whichever companion is
`companions[0]`, so prepending silently moves that coverage onto the new title — no
test fails, but the one you thought was covered no longer is. If you do prepend,
that is a deliberate choice worth saying out loud in the PR.

Nothing else changes — the grid, the routes, the section accents and the existing
tests all derive from this array.

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

Then look at the page. The failures here are visual — map pins colliding with each
other or with a zone label, a guide table cramped on a phone, a tagline wrapping onto
three lines — and no assertion catches any of them.

```bash
node .claude/skills/add-companion-app/scripts/shoot-companion.mjs <slug>
```

That builds the site, serves it, and screenshots `/together` plus your page at 1280px
and 390px, failing if either scrolls sideways. It prints the PNG paths — **open them
and actually look**. The overflow check only catches the page scrolling; overlapping
pins fit inside the box and still look wrong, so they are yours to spot.

390px is where map pins break, because a pin's width comes from its text and does not
shrink with the map. If two collide, shorten the names before moving the coordinates.

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
the repo rule is that it gets a GitHub issue immediately, not just a prose note. When
you genuinely cannot file one, because the run has no remote write access, say so
plainly in the hand-back and list what needs filing. An unfilable issue reported is a
loose end someone can pick up; an unfilable issue left as a prose note is one that
quietly never happens.
