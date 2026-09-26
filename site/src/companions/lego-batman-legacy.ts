import type { Companion } from './types';

/*
 * LEGO Batman: Legacy of the Dark Knight.
 *
 * HOW TO EDIT: everything below is plain data — add a row, a link or a note and
 * it shows up on /together/lego-batman-legacy with no component changes.
 *
 * SOURCING: checked in September 2026 against PowerPyx's trophy guide and
 * roadmap, legobatmanwiki.com's collectibles and red-brick pages, Push Square's
 * collectibles walkthrough, Kotaku's and GamingBolt's tips articles, GameRant's
 * co-op guide and Wikipedia. The PSN trophy list (52 trophies: 1 platinum,
 * 3 gold, 4 silver, 44 bronze) matches our snapshots. Where sources disagree on
 * a count the table carries the figure most of them agree on, and "Our notes"
 * names the disagreement. There is deliberately no map: the radio towers mark
 * every collectible in-game, and we have no places of our own worth pinning.
 */
export const legoBatmanLegacy: Companion = {
  slug: 'lego-batman-legacy',
  name: 'LEGO Batman: Legacy of the Dark Knight',
  tagline: 'Open-world Gotham, brick by brick',
  blurb:
    'Traveller’s Tales’ open-world LEGO Batman, out on PS5 since 22 May 2026. Seven playable heroes, a Batcave to fill, and a long collectible tail after the story. This page is the lookups we keep making on the way to the platinum.',
  psnTitleNames: ['LEGO® Batman™: Legacy of the Dark Knight'],
  backdrop: 'skyline',
  facts: [
    { label: 'Platform', value: 'PS5' },
    { label: 'Released', value: '22 May 2026' },
    { label: 'Co-op', value: '2 players, local split-screen' },
    { label: 'Trophies', value: '52, none missable' },
  ],

  quickReference: [
    {
      title: 'Road to the platinum',
      items: [
        {
          term: 'Nothing is missable',
          detail:
            'No trophy can be locked out, difficulty does not affect any of them, and none need co-op. One playthrough is enough.',
        },
        {
          term: 'Story first, then districts',
          detail:
            'Play the Prologue and all five chapters without chasing collectibles — you need the later characters and gadgets anyway. Then clear Gotham district by district in free roam.',
        },
        {
          term: 'Radio towers reveal the map',
          detail:
            'From Chapter 4, Batgirl can activate the radio tower in each of the nine districts. That marks the district’s collectibles and side activities on the map.',
        },
        {
          term: 'Lock icons mean “come back later”',
          detail: 'A lock on the map is an activity that needs a character you have not unlocked yet. Skip it and move on.',
        },
        {
          term: 'Replay from the Batcomputer',
          detail: 'Finished missions can be replayed from the Batcomputer in the Batcave to pick up anything you missed.',
        },
      ],
    },
    {
      title: 'Handy controls',
      items: [
        { term: 'Detective Mode: click the right stick', detail: 'Highlights puzzles, interactables and objectives. Use it in every new area.' },
        { term: 'Scan', detail: 'Marks nearby enemies and pings objects of interest — worth a tap whenever you walk into somewhere new.' },
        { term: 'Hold down on the d-pad', detail: 'Quick character swap, showing each hero’s gadgets.' },
        { term: 'Gadgets pick themselves', detail: 'Aiming at an interactive point switches to the gadget it needs, so there is no menu to dig through.' },
        { term: 'Tyre icons are Batmobile puzzles', detail: 'Those open-world puzzles want the Batmobile’s grapple cannon or its weight.' },
      ],
    },
    {
      title: 'Studs',
      items: [
        {
          term: 'Build the multiplier before purple studs',
          detail: 'Purple studs are worth 10,000–40,000. Get the stud multiplier to 3 or 4 before you grab one.',
        },
        { term: 'Drive through things', detail: 'Smashing scenery with the Batmobile and firing its missiles at breakables pays thousands of studs.' },
        { term: 'Cash in challenges', detail: 'Studs from completed challenges wait at the Batcave computer — go back and collect them.' },
        {
          term: 'Stud loss on death can be turned off',
          detail: 'It is in the accessibility settings, if losing studs ever stops being fun.',
        },
      ],
    },
    {
      title: 'Upgrades worth getting early',
      items: [
        { term: 'Perfect Counter', detail: 'Countering with exact timing deals boosted damage.' },
        { term: 'Grapple Slam (Batman)', detail: 'Vault an enemy, then tap R2 — the answer to shield carriers.' },
        { term: 'Gordon’s blaster', detail: 'Upgrade his bouncing projectile for crowd control — it is the recommended pick for the AR combat trials.' },
        {
          term: 'Workbenches are in the shops',
          detail: 'Gadget upgrades are bought at workbenches inside Bat-Mite shops (the shopping-cart icon) — turn left as you walk in.',
        },
        { term: 'WayneTech Chips pay for gadgets', detail: 'Every WayneTech Cache opened is gadget-upgrade currency, and the milestones hand out suits too.' },
      ],
    },
    {
      title: 'Couch co-op',
      items: [
        { term: 'Local only', detail: 'Split-screen on one PS5. There is no online co-op.' },
        {
          term: 'Drop in from the pause screen',
          detail: 'On the second controller, pause and press the drop-in button shown top right. Player 2 takes over the companion hero already in the level. Drop out the same way.',
        },
        { term: 'Split the roster', detail: 'One on a fighter (Batman, Nightwing), the other on a utility hero (Robin, Catwoman), so more puzzles are covered at once.' },
      ],
    },
  ],

  guides: [
    {
      title: 'Collectibles',
      intro: 'Everything the “A Watchful Collector” gold counts, plus the side hunts that pay out suits. Totals are the figure most sources agree on — see Our notes for the disagreements.',
      columns: [
        { id: 'name', label: 'Collectible' },
        { id: 'total', label: 'Total', numeric: true },
        { id: 'gives', label: 'What it gets you' },
      ],
      rows: [
        { id: 'waynetech', cells: { name: 'WayneTech Caches', total: 200, gives: 'WayneTech Chips for gadget upgrades, plus suits at milestones' } },
        { id: 'batcave-trophies', cells: { name: 'Batcave trophy parts', total: 170, gives: 'Complete 22 display trophies for the Batcave' } },
        { id: 'puzzles', cells: { name: 'Puzzle rooms', total: 121, gives: 'Riddler, Cluemaster and Subwayne puzzles. Pays out suits' } },
        { id: 'suits', cells: { name: 'Suits', total: 100, gives: 'Their own silver trophy. From the story, shops and open-world activities' } },
        { id: 'bat-symbols', cells: { name: 'Bat-Symbols', total: 50, gives: 'Open-world hunt. The trophy wants 25' } },
        { id: 'vehicles', cells: { name: 'Vehicles', total: 30, gives: 'Their own silver trophy. Bought and built with studs' } },
        { id: 'skill-bricks', cells: { name: 'Skill Bricks', total: 30, gives: 'Permanent character skill upgrades' } },
        { id: 'ar-trials', cells: { name: 'AR Trials', total: 30, gives: 'Driving, traversal and combat. 5 golds is a trophy' } },
        { id: 'red-bricks', cells: { name: 'Red Bricks', total: 23, gives: 'Cosmetic colour schemes for suits and vehicles (table below)' } },
        { id: 'zoo', cells: { name: 'Escaped zoo animals', total: 21, gives: 'Suits at 9 and 15, a Gold Skill Brick at 21' } },
        { id: 'fast-travel', cells: { name: 'Subwayne stations', total: 9, gives: 'Fast travel. Unlocking all 9 is a trophy' } },
        { id: 'wanted', cells: { name: 'Wanted Posters', total: 7, gives: 'Lead to the Knightmare suit' } },
      ],
    },
    {
      title: 'Red Bricks',
      intro: 'All cosmetic. They recolour any suit or vehicle and do nothing for combat or studs. 14 are hidden in story missions, and 9 are bought from Bat-Mite’s shop, whose stock rotates.',
      columns: [
        { id: 'name', label: 'Red Brick' },
        { id: 'where', label: 'Where' },
        { id: 'mission', label: 'Mission', numeric: true },
      ],
      rows: [
        { id: 'ninja', cells: { name: 'Ninja', where: 'Story mission', mission: 1 } },
        { id: 'nautical', cells: { name: 'Nautical', where: 'Story mission', mission: 2 } },
        { id: 'filthy-rich', cells: { name: 'Filthy Rich', where: 'Story mission', mission: 3 } },
        { id: 'toxic-waste', cells: { name: 'Toxic Waste', where: 'Story mission', mission: 4 } },
        { id: 'feline', cells: { name: 'Feline', where: 'Story mission', mission: 5 } },
        { id: 'gothic', cells: { name: 'Gothic', where: 'Story mission', mission: 6 } },
        { id: 'artist', cells: { name: 'Artist', where: 'Story mission', mission: 7 } },
        { id: 'showbiz', cells: { name: 'Showbiz', where: 'Story mission', mission: 8 } },
        { id: 'clown', cells: { name: 'Clown', where: 'Story mission', mission: 9 } },
        { id: 'power-plant', cells: { name: 'Power Plant', where: 'Story mission', mission: 10 } },
        { id: 'flower-power', cells: { name: 'Flower Power', where: 'Story mission', mission: 11 } },
        { id: 'fire-breather', cells: { name: 'Fire Breather', where: 'Story mission', mission: 12 } },
        { id: 'ice-age', cells: { name: 'Ice Age', where: 'Story mission', mission: 13 } },
        { id: 'bats', cells: { name: 'Bats', where: 'Story mission', mission: 14 } },
        { id: 'beauty', cells: { name: 'Beauty', where: 'Bat-Mite’s shop' } },
        { id: 'construction', cells: { name: 'Construction', where: 'Bat-Mite’s shop' } },
        { id: 'festive', cells: { name: 'Festive', where: 'Bat-Mite’s shop' } },
        { id: 'futuristic', cells: { name: 'Futuristic', where: 'Bat-Mite’s shop' } },
        { id: 'gcpd', cells: { name: 'GCPD', where: 'Bat-Mite’s shop' } },
        { id: 'glitch', cells: { name: 'Glitch', where: 'Bat-Mite’s shop' } },
        { id: 'groovy', cells: { name: 'Groovy', where: 'Bat-Mite’s shop' } },
        { id: 'magic', cells: { name: 'Magic', where: 'Bat-Mite’s shop' } },
        { id: 'sporty', cells: { name: 'Sporty', where: 'Bat-Mite’s shop' } },
      ],
    },
    {
      title: 'Grind trophies',
      intro: 'The counter-based trophies that finish themselves if you keep an eye on them during free roam. All bronze.',
      columns: [
        { id: 'trophy', label: 'Trophy' },
        { id: 'task', label: 'What it wants' },
        { id: 'target', label: 'Target', numeric: true },
      ],
      rows: [
        { id: 'studs', cells: { trophy: '“Life’s been good to me.”', task: 'Studs collected, cumulative', target: 1000000 } },
        { id: 'stud-combo', cells: { trophy: '“Never do it for free.”', task: 'Studs inside one stud-combo multiplier', target: 30000 } },
        { id: 'counters', cells: { trophy: 'Caped Defender', task: 'Successful counters', target: 100 } },
        { id: 'stealth', cells: { trophy: '“I am the shadows.”', task: 'Stealth takedowns', target: 100 } },
        { id: 'events', cells: { trophy: '“You’re becoming quite a celebrity.”', task: 'Open-world events discovered', target: 100 } },
        { id: 'hits', cells: { trophy: 'The Strength to Fight', task: 'Combo hits without taking damage', target: 99 } },
        { id: 'max-combo', cells: { trophy: '“I’m good with calculation.”', task: 'Seconds at max stud combo', target: 60 } },
        { id: 'crimes', cells: { trophy: '“Gotham can feel a little safer.”', task: 'Crimes prevented', target: 30 } },
        { id: 'challenges', cells: { trophy: 'Up for the Challenge', task: 'Challenges completed', target: 20 } },
        { id: 'crime-types', cells: { trophy: '“Things have improved.”', task: 'Each crime type prevented once', target: 10 } },
        { id: 'wind', cells: { trophy: '“Is that like parachuting?”', task: 'Different wind tunnels glided through', target: 10 } },
        { id: 'enemies', cells: { trophy: 'Cowardly and Superstitious Lot', task: 'Each enemy type defeated once', target: 6 } },
        { id: 'ar-gold', cells: { trophy: '“Wouldn’t wanna make things too easy.”', task: 'Gold medals in AR Trials', target: 5 } },
      ],
    },
  ],

  links: [
    {
      group: 'Trophies',
      label: 'PowerPyx — trophy guide & roadmap',
      href: 'https://www.powerpyx.com/lego-batman-legacy-of-the-dark-knight-trophy-guide-roadmap/',
      note: 'The full list with a tip for each trophy, and the three-step plan the quick reference follows.',
    },
    {
      group: 'Trophies',
      label: 'KeenGamer — trophy list',
      href: 'https://www.keengamer.com/articles/guides/lego-batman-legacy-of-the-dark-knight-trophy-list-and-achievements-guide/',
      note: 'Every trophy’s exact in-game wording, if a requirement ever reads ambiguously.',
    },
    {
      group: 'Collectibles',
      label: 'LEGO Batman Wiki — all collectibles',
      href: 'https://legobatmanwiki.com/legacy-of-the-dark-knight/collectibles/',
      note: 'Every category with its total and reward. Where the collectibles table above comes from.',
    },
    {
      group: 'Collectibles',
      label: 'LEGO Batman Wiki — red bricks',
      href: 'https://legobatmanwiki.com/legacy-of-the-dark-knight/red-bricks/',
      note: 'Where each mission brick is hidden, brick by brick.',
    },
    {
      group: 'Collectibles',
      label: 'Push Square — 100% collectibles walkthrough',
      href: 'https://www.pushsquare.com/guides/lego-batman-legacy-of-the-dark-knight-guide-100percent-collectibles-walkthrough',
      note: 'Mission-by-mission, for replaying a level from the Batcomputer to mop up.',
    },
    {
      group: 'Collectibles',
      label: 'Game8 — list of all collectibles',
      href: 'https://game8.co/games/Lego-Batman-Legacy-of-the-Dark-Knight/archives/601586',
      note: 'A second opinion when a count looks off.',
    },
    {
      group: 'Tips',
      label: 'Kotaku — 16 things to know',
      href: 'https://kotaku.com/16-things-to-know-before-playing-lego-batman-legacy-of-the-dark-knight-2000697114',
      note: 'Most of the controls and stud tips above come from here.',
    },
    {
      group: 'Tips',
      label: 'GamingBolt — 15 beginner tips',
      href: 'https://gamingbolt.com/lego-batman-legacy-of-the-dark-knight-guide-15-beginners-tips-and-tricks-you-need-to-know',
      note: 'The combat abilities worth unlocking first, with what each one does.',
    },
    {
      group: 'Tips',
      label: 'GameRant — co-op & multiplayer',
      href: 'https://gamerant.com/lego-batman-legacy-dark-knight-co-op/',
      note: 'How drop-in split-screen works, for when we play on one console.',
    },
  ],

  videos: [
    {
      title: 'Lego Batman — 10 Things to Do FIRST',
      youtubeId: '_nyTvY5EEVE',
      note: 'IGN’s short list of what to prioritise once Gotham opens up.',
    },
    {
      title: 'ULTIMATE LEGO Batman Legacy of the Dark Knight Beginner Guide',
      youtubeId: 'kSjR6suGVkk',
      note: 'The long one, from Born 2 Game. Covers collectibles and puzzles as well as the basics.',
    },
    {
      title: '10 Things You Must Do First in LEGO Batman: Legacy of the Dark Knight!',
      youtubeId: 'Pd6fQGKO1A8',
      note: 'Blitzwinger’s take on the same question — useful for the tips IGN skips.',
    },
  ],

  notes: [
    {
      title: 'Where the counts disagree',
      body: 'Guides do not agree on three totals. Suits: 100 per PowerPyx, 101 per the LEGO Batman Wiki. WayneTech Caches: both give 200 in their collectible breakdowns, but one trophy description says 130. Puzzle rooms: 121 in both breakdowns, 117 in one trophy description. The table uses the agreed figure. If the in-game counter says otherwise, trust the game and fix the table.',
    },
    {
      title: 'Keep this page honest',
      body: 'Checked against PowerPyx, the LEGO Batman Wiki, Push Square, Kotaku, GamingBolt and GameRant in September 2026, four months after launch. Patches can move things, so correct anything that has drifted in site/src/companions/lego-batman-legacy.ts. It is all plain data.',
    },
  ],
};
