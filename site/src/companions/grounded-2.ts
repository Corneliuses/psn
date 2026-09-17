import type { Companion } from './types';

/*
 * Grounded 2 — the first companion app.
 *
 * HOW TO EDIT: everything below is plain data. Add a row, a pin, a link or a
 * note and it shows up on /together/grounded-2 — no component changes needed.
 * Drop a whole module (e.g. `videos`) and the page simply stops rendering that
 * section.
 *
 * SOURCING: the reference and gear entries were checked against the community
 * wiki (grounded.wiki.gg), Game8's Grounded 2 guides and the game's own site in
 * September 2026, while the game is still in early access — so item tiers,
 * roadmap items and balance move. The map pins and the notes are ours by
 * definition: they describe our save, not the game's official content.
 */
export const grounded2: Companion = {
  slug: 'grounded-2',
  name: 'Grounded 2',
  tagline: 'Shrunk in Brookhollow Park',
  blurb:
    'Survival co-op at bug scale, from Obsidian. Early access on PS5 since 11 August 2026, alongside the Into the Abyss update that opened the pond. This page is the stuff we keep looking up mid-session.',
  psnTitleNames: ['Grounded 2'],

  quickReference: [
    {
      title: 'Damage types',
      items: [
        {
          term: 'Physical: chopping, slashing, smashing, stabbing, explosive',
          detail:
            'Most creatures resist some and take extra from others, so the right weapon can halve a fight. Ants are weak to slashing; the ladybug folds to smashing.',
        },
        {
          term: 'Elemental: fresh, salty, sour, spicy',
          detail:
            'Layered on top of the physical types. Spiders take extra from spicy, which is why the spicy weapons are worth the detour.',
        },
        {
          term: 'Check before you commit',
          detail:
            'Creature entries list weaknesses and resistances. Reading one costs a few seconds and saves a whole fight.',
        },
      ],
    },
    {
      title: 'The Omni-Tool',
      items: [
        {
          term: 'One tool, four forms',
          detail:
            'Omni-Hammer for smashing, Omni-Axe for chopping grass and weeds, Omni-Shovel for digging, Omni-Wrench for utility. It replaces the separate tools from the first game.',
        },
        {
          term: 'Tier gates everything',
          detail:
            'Harder resource nodes need a higher tier, so upgrading is what unlocks the next chunk of the game rather than a nice-to-have.',
        },
        {
          term: 'Where the tiers stand',
          detail:
            'Tier 2 is straightforward for all four. Tier 3 exists for the Hammer and Axe; the Shovel and Wrench are still waiting. Five tiers are planned.',
        },
        {
          term: 'The Hammer opens molars',
          detail: 'Milk Molars need the Omni-Hammer to break, so it gates the permanent upgrades too.',
        },
      ],
    },
    {
      title: 'Milk Molars & mutations',
      items: [
        {
          term: 'Three kinds of molar',
          detail:
            'The park holds 47 Milk Molars, 22 Mega Milk Molars and 44 Moldy Milk Molars. Normal ones upgrade only the finder; Mega ones upgrade everyone in the game.',
        },
        {
          term: 'Spend them on slots first',
          detail:
            'You start with 2 mutation slots and can reach 5. The third is the cheapest, so buy it before anything else; later slots cost progressively more.',
        },
        {
          term: 'Mutations come from repetition',
          detail: 'Perks unlock by doing the thing — keep using a weapon type and its mutation arrives on its own.',
        },
      ],
    },
    {
      title: 'First session checklist',
      items: [
        {
          term: 'Scan everything',
          detail:
            'Analyze new materials at a Ranger Station. That is what unlocks recipes and pays out Raw Science for the Science Shop.',
        },
        {
          term: 'Lean-To, then Workbench, then chests',
          detail: 'A Lean-To lets you sleep through the night, and storage stops the inventory churn.',
        },
        {
          term: 'Water before you need it',
          detail: 'A Dew Collector and Water Containers keep the Canteen topped up passively.',
        },
        {
          term: 'Aphid Slippers early',
          detail: 'Cheap to craft and carry Quickness, which makes every gathering run shorter.',
        },
        {
          term: 'Drop Trail Markers',
          detail: 'They stay on the map and can be renamed. Getting lost at this scale costs a whole session.',
        },
      ],
    },
    {
      title: 'Buggies (mounts)',
      items: [
        {
          term: 'Unlocked through the story',
          detail: 'Progress to the Egg Hunt quest — buggies are not something you can rush from the first day.',
        },
        {
          term: 'The sequence',
          detail:
            'Buy the Hatchery data pack at a Ranger Station for 500 Raw Science, build the Hatchery, take an egg from the Hatchery Anthill, and add the saddle parts.',
        },
        {
          term: 'Red Soldier Ant saddle',
          detail: '2x Grub Hide, 3x Sprigs, 1x Acorn Shell. Then wait about 12 in-game hours for the hatch.',
        },
        {
          term: 'They fight for you',
          detail: 'A hatched buggy can be ridden, or left to run alongside and take on what jumps you.',
        },
      ],
    },
    {
      title: 'Playing as a pair',
      items: [
        { term: 'Split the roles', detail: 'One gathers, one builds. Swapping mid-session is how half-finished bases happen.' },
        { term: 'Mega molars are shared', detail: 'Whoever finds one upgrades both of us, so hand them over rather than hoarding.' },
        { term: 'Revives beat heroics', detail: 'Back off, heal, come back together. Fights at this scale punish solo aggression.' },
        { term: 'One shared stash', detail: 'Keep a single chest by the door for shared materials so neither of us is hunting the other one down.' },
      ],
    },
  ],

  map: {
    caption:
      'Our own rough mental model of how the park hangs together, hand-drawn and deliberately not to scale — not the game map, and not its real geometry. Zone names are the game’s; the pins are ours. Use an interactive map above for real positions.',
    zones: [
      { id: 'park', label: 'Brookhollow Park', x: 32, y: 36, rx: 26, ry: 24, tone: 'landmark' },
      { id: 'gnarly-bark', label: 'Gnarly Bark', x: 72, y: 26, rx: 21, ry: 19, tone: 'resource' },
      { id: 'pergola', label: 'Pergola', x: 76, y: 70, rx: 19, ry: 16, tone: 'creature' },
      { id: 'pond', label: 'Skunk Pond', x: 26, y: 76, rx: 20, ry: 15, tone: 'landmark' },
    ],
    categories: [
      { id: 'base', label: 'Our bases', tone: 'base' },
      { id: 'resource', label: 'Resource runs', tone: 'resource' },
      { id: 'danger', label: 'Avoid at night', tone: 'creature' },
      { id: 'landmark', label: 'Landmarks', tone: 'landmark' },
    ],
    pins: [
      { id: 'home', name: 'Main base', categoryId: 'base', x: 34, y: 40, note: 'Shared stash by the door. Dew collector and water containers on the roof.' },
      { id: 'ranger', name: 'Ranger Station', categoryId: 'landmark', x: 46, y: 22, note: 'Scan point and Science Shop. Everything unlocks here.' },
      { id: 'outpost', name: 'Gnarly Bark camp', categoryId: 'base', x: 70, y: 22, note: 'Lean-to and a spare bed for long harvesting runs.' },
      { id: 'stems', name: 'Stem harvest', categoryId: 'resource', x: 78, y: 36, note: 'Densest patch we have found. Worth the walk.' },
      { id: 'pond-edge', name: 'Pond edge', categoryId: 'resource', x: 26, y: 74, note: 'Way into the Abyss. Do not swim it without the diving gear.' },
      { id: 'nest', name: 'Nest approach', categoryId: 'danger', x: 76, y: 68, note: 'Do not path through here after dark.' },
    ],
  },

  guides: [
    {
      title: 'Omni-Tool',
      intro: 'The four forms, what each one is for, and how far it upgrades in the current early-access build.',
      columns: [
        { id: 'name', label: 'Form' },
        { id: 'use', label: 'What it does' },
        { id: 'tier', label: 'Top tier now', numeric: true },
      ],
      rows: [
        { id: 'hammer', cells: { name: 'Omni-Hammer', use: 'Smashing. Breaks Milk Molars and hard nodes', tier: 3 } },
        { id: 'axe', cells: { name: 'Omni-Axe', use: 'Chopping. Cuts grass, weeds and plant matter down to size', tier: 3 } },
        { id: 'shovel', cells: { name: 'Omni-Shovel', use: 'Digging. Tier 3 recipe not in the game yet', tier: 2 } },
        { id: 'wrench', cells: { name: 'Omni-Wrench', use: 'Utility and repair. Tier 3 recipe not in the game yet', tier: 2 } },
      ],
    },
    {
      title: 'Weapons',
      intro: 'Community picks for early and mid game. Early access, so treat tiers as current rather than settled.',
      columns: [
        { id: 'name', label: 'Weapon' },
        { id: 'kind', label: 'Type' },
        { id: 'use', label: 'Why it is picked' },
        { id: 'stage', label: 'Stage' },
      ],
      rows: [
        { id: 'pebblet-spear', cells: { name: 'Pebblet Spear', kind: 'Spear', use: 'The first thing to craft — reach and stabbing damage', stage: 'Early' } },
        { id: 'mosquito-needle', cells: { name: 'Mosquito Needle', kind: 'Dagger', use: 'Lifesteal. Widely called the best early weapon for exactly that', stage: 'Early' } },
        { id: 'red-ant-club', cells: { name: 'Red Ant Club', kind: 'Club', use: 'Stun damage against armoured enemies', stage: 'Early' } },
        { id: 'crimson-saber', cells: { name: 'Crimson Saber', kind: 'Sword', use: 'Step up once you have analyzed Red Ant Mandibles', stage: 'Early' } },
        { id: 'spider-stringer', cells: { name: 'Spider Stringer', kind: 'Bow', use: 'Tier 2 ranged option, easy to reach via the spiders near the oak tree', stage: 'Early' } },
        { id: 'mantis-blade', cells: { name: 'Mantis Blade', kind: 'Sword', use: 'High crit rate and damage per second', stage: 'Mid' } },
        { id: 'gloom-skewer', cells: { name: 'Gloom Skewer', kind: 'Spear', use: 'Currently the strongest spear in the game', stage: 'Mid' } },
        { id: 'scorching-orb', cells: { name: 'Scorching Orb', kind: 'Staff', use: 'Projectiles that inflict Sizzling — the entry point for a magic build', stage: 'Mid' } },
      ],
    },
    {
      title: 'Armour',
      intro: 'What to wear and when, plus the one set worth building specifically for mid-game bosses.',
      columns: [
        { id: 'name', label: 'Set' },
        { id: 'use', label: 'What it is for' },
        { id: 'stage', label: 'Stage' },
      ],
      rows: [
        { id: 'acorn', cells: { name: 'Acorn Armor', use: 'Best general starting set for melee — solid defence and extra max health', stage: 'Early' } },
        { id: 'grub', cells: { name: 'Grub Set', use: 'The ranged-damage counterpart to Acorn', stage: 'Early' } },
        { id: 'aphid-slippers', cells: { name: 'Aphid Slippers', use: 'Quickness. Cheap, and it shortens every gathering run', stage: 'Early' } },
        { id: 'sizzling', cells: { name: 'Sizzling Armor', use: 'Sizzle Reduction — most mid-game bosses lean on Sizzle attacks', stage: 'Mid' } },
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
        { id: 'planks', cells: { name: 'Grass planks', source: 'Cut grass blades with the Omni-Axe', used: 'Floors, walls, most early structures' } },
        { id: 'stems', cells: { name: 'Weed stems', source: 'Stem harvest pin, east side', used: 'Frames, supports, scaffolding' } },
        { id: 'sprigs', cells: { name: 'Sprigs', source: 'Scattered, everywhere', used: 'Tools, arrows, saddles, small crafts' } },
        { id: 'acorn', cells: { name: 'Acorn shells', source: 'Under the oak', used: 'Acorn armour and saddle parts' } },
        { id: 'grub-hide', cells: { name: 'Grub hide', source: 'Grubs, under the soil', used: 'Grub set and saddles' } },
        { id: 'clover', cells: { name: 'Clover leaves', source: 'Clover patches in the open', used: 'Roofing and rain cover' } },
      ],
    },
  ],

  links: [
    {
      group: 'Interactive maps',
      label: 'The Hidden Gaming Lair — Grounded 2 map',
      href: 'https://grounded2.th.gl/',
      note: 'The best one for us: a live second-screen overlay that auto-detects whether you are in the park or the Abyss.',
    },
    {
      group: 'Interactive maps',
      label: 'Game8 interactive map',
      href: 'https://game8.co/games/Grounded-2/archives/539770',
      note: 'Brookhollow Park with Milk Molars, creatures and resources filterable by layer.',
    },
    {
      group: 'Interactive maps',
      label: 'MetaForge map',
      href: 'https://metaforge.app/grounded-2/map/main',
      note: 'Loot spots, points of interest and mob locations, with a separate Abyss map in the dropdown.',
    },
    {
      group: 'Wikis & databases',
      label: 'Grounded Wiki (wiki.gg)',
      href: 'https://grounded.wiki.gg/',
      note: 'The community wiki, and the one to trust first. Covers both games.',
    },
    {
      group: 'Wikis & databases',
      label: 'Creatures (Grounded 2)',
      href: 'https://grounded.wiki.gg/wiki/Creatures_(Grounded_2)',
      note: 'Every bug with its weaknesses, resistances and drops — the mid-fight lookup.',
    },
    {
      group: 'Wikis & databases',
      label: 'Biomes (Grounded 2)',
      href: 'https://grounded.wiki.gg/wiki/Biomes_(Grounded_2)',
      note: 'What is in each area of the park, and of the Abyss.',
    },
    {
      group: 'Wikis & databases',
      label: 'Game8 walkthrough hub',
      href: 'https://game8.co/games/Grounded-2',
      note: 'Fastest structured answers when the wiki page is still a stub.',
    },
    {
      group: 'Progression',
      label: 'Milk Molars (Grounded 2)',
      href: 'https://grounded.wiki.gg/wiki/Milk_Molars_(Grounded_2)',
      note: 'What each upgrade does, and which are shared across the whole game.',
    },
    {
      group: 'Progression',
      label: 'All Milk Molar locations',
      href: 'https://techraptor.net/gaming/guides/grounded-2-milk-molar-locations',
      note: 'Location-by-location list for when we are sweeping an area clean.',
    },
    {
      group: 'Progression',
      label: 'Mutations (Grounded 2)',
      href: 'https://grounded.wiki.gg/wiki/Mutations_(Grounded_2)',
      note: 'Every perk and how it unlocks — worth skimming before spending molars on slots.',
    },
    {
      group: 'Progression',
      label: 'All Omni-Tool upgrades',
      href: 'https://game8.co/games/Grounded-2/archives/539702',
      note: 'Exact recipes per tier, so we know what to gather before walking back.',
    },
    {
      group: 'Gear',
      label: 'Best weapons tier list',
      href: 'https://game8.co/games/Grounded-2/archives/539768',
      note: 'Where the weapons table above comes from. Re-check it after each update.',
    },
    {
      group: 'Gear',
      label: 'Best armor tier list',
      href: 'https://game8.co/games/Grounded-2/archives/540312',
      note: 'Same, for armour sets and their mods.',
    },
    {
      group: 'Gear',
      label: 'Buggies',
      href: 'https://grounded.wiki.gg/wiki/Buggies',
      note: 'Every mount, what it is good at, and the egg and saddle each one needs.',
    },
    {
      group: 'News & community',
      label: 'Official Grounded 2 site',
      href: 'https://grounded2.obsidian.net/',
      note: 'Patch notes and the early-access roadmap, straight from Obsidian.',
    },
    {
      group: 'News & community',
      label: 'r/GroundedGame',
      href: 'https://www.reddit.com/r/GroundedGame/',
      note: 'Base builds worth stealing and whatever is currently broken.',
    },
  ],

  videos: [
    {
      title: '40 Grounded 2 Tips You NEED To Know',
      youtubeId: 'tdu3G757Y8o',
      note: 'The broad one. Base building and combat, good to watch together before a session.',
    },
    {
      title: 'The Perfect Grounded 2 Base — 30+ Base Building Tips',
      youtubeId: 'gwzRsBYGmtY',
      note: 'Build mechanics that the game never explains, including several we were doing the hard way.',
    },
    {
      title: '15 Must Know Grounded 2 Tips: Base Building, Raids & More',
      youtubeId: 'Jg8wp0Kax2o',
      note: 'Shorter, and the raid section is the part worth watching before our base gets attacked again.',
    },
    {
      title: 'Best Base Locations & All Secret Unlocks',
      youtubeId: '4MtKtMTtx_Y',
      note: 'Location scouting for when we decide to move the main base.',
    },
  ],

  notes: [
    {
      title: 'House rules',
      body: 'Nobody dismantles the other person’s build without asking. Shared materials go in the door chest, personal stuff stays in your own.',
    },
    {
      title: 'Next session',
      body: 'Finish the roof on the Gnarly Bark camp, buy the third mutation slot, then take the pond descent together in daylight.',
    },
    {
      title: 'Why our trophy count is zero',
      body: 'Grounded 2 is still in early access on PS5 and has no trophy list yet, so the stats above will read zero trophies no matter how long we play. Playtime is the real number here.',
    },
    {
      title: 'Keep this page honest',
      body: 'Checked against the wiki and Game8 in September 2026. The game is in early access, so tiers and balance move — correct anything that has drifted in site/src/companions/grounded-2.ts. It is all plain data.',
    },
  ],
};
