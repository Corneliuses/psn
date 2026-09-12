import type { Companion } from './types';

/*
 * Grounded 2 — the first companion app.
 *
 * HOW TO EDIT: everything below is plain data. Add a row, a pin, a link or a
 * note and it shows up on /together/grounded-2 — no component changes needed.
 * Drop a whole module (e.g. `videos`) and the page simply stops rendering that
 * section.
 *
 * ACCURACY: the reference and gear entries were seeded from general knowledge of
 * the game and are meant to be corrected in place as we play. The map pins and
 * the notes are ours by definition — they describe our save, not the game's
 * official content.
 */
export const grounded2: Companion = {
  slug: 'grounded-2',
  name: 'Grounded 2',
  tagline: 'Shrunk in Brookhollow Park',
  blurb:
    'Survival co-op at bug scale. This page is the stuff we keep looking up mid-session — where our base gear is, what hurts what, and the sites worth opening on a second screen.',
  psnTitleNames: ['Grounded 2'],

  quickReference: [
    {
      title: 'Damage types',
      items: [
        {
          term: 'Match the weapon to the shell',
          detail:
            'Most creatures resist some damage types and take extra from others. Check a creature in the field guide before committing to a fight — the wrong weapon can double the length of a fight.',
        },
        {
          term: 'Chopping',
          detail: 'Plant matter and softer-bodied bugs. Also how most grass and stems get harvested.',
        },
        {
          term: 'Smashing',
          detail: 'Hard shells and armoured bugs. Slow to swing, so it wants an opening rather than a trade.',
        },
        {
          term: 'Slashing / stabbing',
          detail: 'Fast, lower damage per hit. Good against anything that moves faster than you do.',
        },
      ],
    },
    {
      title: 'First session checklist',
      items: [
        { term: 'Tool first', detail: 'Get the multi-tool and its early upgrades before anything ambitious — gathering tier gates everything else.' },
        { term: 'Water and food', detail: 'Dew off grass blades early; build a water collector before it becomes the thing you run back for.' },
        { term: 'Drop a marker', detail: 'Mark the base before exploring. Getting lost at this scale costs a whole session.' },
        { term: 'Bank your progress', detail: 'Permanent upgrades are worth spending as you find them, not hoarding.' },
      ],
    },
    {
      title: 'Playing as a pair',
      items: [
        { term: 'Split the roles', detail: 'One gathers, one builds. Swapping mid-session is how half-finished bases happen.' },
        { term: 'Revives beat heroics', detail: 'Back off, heal, come back together. Fights at this scale punish solo aggression.' },
        { term: 'One shared stash', detail: 'Keep a single chest by the door for shared materials so neither of us is hunting the other one down.' },
      ],
    },
  ],

  map: {
    caption:
      'A stylized orientation sketch of our own save — drawn by hand, not to scale, and not a copy of the in-game map. Pins are places we care about, not official locations.',
    zones: [
      { id: 'yard', label: 'Open ground', x: 34, y: 40, rx: 26, ry: 24, tone: 'landmark' },
      { id: 'grass', label: 'Tall grass', x: 70, y: 30, rx: 22, ry: 20, tone: 'resource' },
      { id: 'pond', label: 'Water', x: 24, y: 76, rx: 18, ry: 14, tone: 'landmark' },
      { id: 'nest', label: 'Bug territory', x: 74, y: 72, rx: 20, ry: 17, tone: 'creature' },
    ],
    categories: [
      { id: 'base', label: 'Our bases', tone: 'base' },
      { id: 'resource', label: 'Resource runs', tone: 'resource' },
      { id: 'danger', label: 'Avoid at night', tone: 'creature' },
      { id: 'landmark', label: 'Landmarks', tone: 'landmark' },
    ],
    pins: [
      { id: 'home', name: 'Main base', categoryId: 'base', x: 36, y: 44, note: 'Shared stash by the door. Dew collectors on the roof.' },
      { id: 'outpost', name: 'Grass outpost', categoryId: 'base', x: 68, y: 26, note: 'Lean-to and a spare bed for long harvesting runs.' },
      { id: 'stems', name: 'Stem harvest', categoryId: 'resource', x: 76, y: 38, note: 'Densest patch we have found. Worth the walk.' },
      { id: 'water', name: 'Water edge', categoryId: 'resource', x: 26, y: 74, note: 'Refill point. Watch the drop-off.' },
      { id: 'nest', name: 'Nest approach', categoryId: 'danger', x: 74, y: 70, note: 'Do not path through here after dark.' },
      { id: 'marker', name: 'Tall landmark', categoryId: 'landmark', x: 48, y: 18, note: 'Visible from most of the yard — use it to re-orient.' },
    ],
  },

  guides: [
    {
      title: 'Equipment',
      intro: 'What we have built, what it is for, and what it costs to make another one.',
      columns: [
        { id: 'name', label: 'Item' },
        { id: 'kind', label: 'Type' },
        { id: 'use', label: 'Best against / used for' },
        { id: 'tier', label: 'Tier', numeric: true },
      ],
      rows: [
        { id: 'tool-1', cells: { name: 'Multi-tool (base)', kind: 'Tool', use: 'Starting gathering tier — soft plants and small nodes', tier: 1 } },
        { id: 'tool-2', cells: { name: 'Multi-tool (upgraded)', kind: 'Tool', use: 'Unlocks the harder resource nodes that gate mid-game building', tier: 2 } },
        { id: 'spear', cells: { name: 'Spear', kind: 'Weapon', use: 'Reach and stabbing damage — safest opener against fast bugs', tier: 1 } },
        { id: 'hammer', cells: { name: 'Hammer', kind: 'Weapon', use: 'Smashing damage for armoured shells', tier: 2 } },
        { id: 'bow', cells: { name: 'Bow', kind: 'Weapon', use: 'Pulling single targets away from a group', tier: 1 } },
        { id: 'shield', cells: { name: 'Shield', kind: 'Defence', use: 'Blocking charges — the difference in every boss-shaped fight', tier: 2 } },
        { id: 'armor-light', cells: { name: 'Light armour set', kind: 'Armour', use: 'Stamina-friendly, for gathering runs', tier: 1 } },
        { id: 'armor-heavy', cells: { name: 'Heavy armour set', kind: 'Armour', use: 'Standing in a fight rather than dodging it', tier: 2 } },
      ],
    },
    {
      title: 'Base materials',
      intro: 'The building blocks we run out of most, and where we go for them.',
      columns: [
        { id: 'name', label: 'Material' },
        { id: 'source', label: 'Where we get it' },
        { id: 'used', label: 'What it builds' },
      ],
      rows: [
        { id: 'planks', cells: { name: 'Grass planks', source: 'Cut grass blades near the open ground', used: 'Floors, walls, most early structures' } },
        { id: 'stems', cells: { name: 'Weed stems', source: 'Stem harvest pin, east side', used: 'Frames, supports, scaffolding' } },
        { id: 'sprigs', cells: { name: 'Sprigs', source: 'Scattered, everywhere', used: 'Tools, arrows, small crafts' } },
        { id: 'fiber', cells: { name: 'Plant fibre', source: 'Broken-down plant matter', used: 'Rope, bindings, storage' } },
        { id: 'clover', cells: { name: 'Clover leaves', source: 'Clover patches in the open', used: 'Roofing and rain cover' } },
      ],
    },
  ],

  links: [
    { label: 'Official Grounded 2 site', href: 'https://grounded.obsidian.net', note: 'Patch notes and what changed since we last played.' },
    { label: 'Grounded Wiki', href: 'https://grounded.fandom.com/wiki/Grounded_Wiki', note: 'Creature pages and recipe lists — the fastest lookup mid-session.' },
    { label: 'r/GroundedGame', href: 'https://www.reddit.com/r/GroundedGame/', note: 'Base builds worth stealing and current bug reports.' },
  ],

  videos: [],

  notes: [
    {
      title: 'House rules',
      body: 'Nobody dismantles the other person\'s build without asking. Shared materials go in the door chest, personal stuff stays in your own.',
    },
    {
      title: 'Next session',
      body: 'Finish the roof on the grass outpost, then push toward the nest together in daylight with the shields built.',
    },
    {
      title: 'Keep this page honest',
      body: 'The reference and gear tables were seeded from memory and should be corrected as we confirm things in game. Edit site/src/companions/grounded-2.ts — it is all plain data.',
    },
  ],
};
