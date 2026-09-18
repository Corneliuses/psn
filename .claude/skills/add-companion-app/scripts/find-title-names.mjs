#!/usr/bin/env node
/*
 * find-title-names — work out the `psnTitleNames` for a companion app.
 *
 * PSN spells the same game differently across stores and trophy lists, and a
 * sequel often shares a prefix with its predecessor. Guessing here is the one
 * mistake that silently shows the WRONG GAME'S numbers on a companion page, so
 * this prints every candidate with the evidence needed to judge it.
 *
 * Usage:  node .claude/skills/add-companion-app/scripts/find-title-names.mjs "grounded"
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const needle = (process.argv[2] ?? '').trim().toLowerCase();

if (!needle) {
  console.error('Usage: node .../find-title-names.mjs "<part of the game name>"');
  process.exit(1);
}

/** Same normalization the data layer's nameKey() uses, so matches agree with it. */
const nameKey = (name) => name.toLowerCase().replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim();
const total = (c) => c.bronze + c.silver + c.gold + c.platinum;
const day = (iso) => (iso ? iso.slice(0, 10) : '—');

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return undefined;
  }
}

const config = readJson(join(REPO_ROOT, 'psn.config.json'));
if (!config) {
  console.error('Could not read psn.config.json — run this from the repo root.');
  process.exit(1);
}

const played = new Map(); // nameKey -> { name, players:Set, minFirst, maxLast, minutes }
const trophies = new Map(); // nameKey -> { name, players:Set, defined, lastTrophyAt }

for (const player of config.players) {
  const snapshot = readJson(join(REPO_ROOT, 'data', player.key, 'latest.json'));
  if (!snapshot) {
    console.error(`No snapshot for ${player.key} — skipping.`);
    continue;
  }

  console.log(`\n=== ${player.displayName} (${player.key}) ===`);

  const hitsPlayed = snapshot.playedTitles.filter((t) => t.name.toLowerCase().includes(needle));
  const hitsTrophy = snapshot.trophyTitles.filter((t) => t.name.toLowerCase().includes(needle));

  if (hitsPlayed.length === 0 && hitsTrophy.length === 0) {
    console.log('  no matches');
    continue;
  }

  if (hitsPlayed.length > 0) {
    console.log('  played titles:');
    for (const t of hitsPlayed) {
      console.log(
        `    ${JSON.stringify(t.name).padEnd(34)} ${String(t.playDurationMinutes).padStart(6)}m` +
          `  ${t.playCount} sessions  ${day(t.firstPlayed)} → ${day(t.lastPlayed)}  [${t.titleId}]`,
      );
      const key = nameKey(t.name);
      const entry = played.get(key) ?? { name: t.name, players: new Set(), minutes: 0, minFirst: '9999', maxLast: '0000' };
      entry.players.add(player.displayName);
      entry.minutes += t.playDurationMinutes;
      if (t.firstPlayed < entry.minFirst) entry.minFirst = t.firstPlayed;
      if (t.lastPlayed > entry.maxLast) entry.maxLast = t.lastPlayed;
      played.set(key, entry);
    }
  }

  if (hitsTrophy.length > 0) {
    console.log('  trophy lists:');
    for (const t of hitsTrophy) {
      console.log(
        `    ${JSON.stringify(t.name).padEnd(34)} ${String(t.earnedTotal).padStart(3)}/${String(total(t.defined)).padEnd(3)} earned` +
          `  ${t.progress}%  last ${day(t.lastTrophyAt)}  [${t.platform} ${t.npCommunicationId}]`,
      );
      const key = nameKey(t.name);
      const entry = trophies.get(key) ?? { name: t.name, players: new Set(), defined: total(t.defined), lastTrophyAt: t.lastTrophyAt };
      entry.players.add(player.displayName);
      if (t.lastTrophyAt > entry.lastTrophyAt) entry.lastTrophyAt = t.lastTrophyAt;
      trophies.set(key, entry);
    }
  }
}

console.log('\n=== judgement ===');

if (played.size === 0 && trophies.size === 0) {
  console.log(`Nothing matches "${needle}". Check the spelling PSN uses — try a shorter fragment.`);
  process.exit(0);
}

console.log('\nPlayed titles found:');
for (const [, e] of played) {
  console.log(
    `  ${JSON.stringify(e.name)} — ${[...e.players].join(' & ')}, ${e.minutes}m total, ${day(e.minFirst)} → ${day(e.maxLast)}`,
  );
}

/*
 * The trap this script exists for: an EARLIER game in the same series matches
 * the same search, and attaching its trophy list to the sequel shows a stranger's
 * numbers on the page. Trophies can only be earned while a game is being played,
 * so a trophy list whose last trophy predates a title's first session cannot
 * belong to that title. That is a fact about the data, not a guess — use it.
 */
console.log(trophies.size > 0 ? '\nTrophy lists, and which played title each can belong to:' : '\nNo trophy lists match. That is normal for a game with no PS5 trophy list yet (early access).');

for (const [, t] of trophies) {
  console.log(`  ${JSON.stringify(t.name)} — ${[...t.players].join(' & ')}, ${t.defined} defined, last earned ${day(t.lastTrophyAt)}`);
  for (const [, p] of played) {
    const impossible = t.lastTrophyAt < p.minFirst;
    console.log(
      `      ${impossible ? 'IMPOSSIBLE for' : 'consistent with'} ${JSON.stringify(p.name)}` +
        (impossible ? ` (last trophy ${day(t.lastTrophyAt)} predates first session ${day(p.minFirst)})` : ''),
    );
  }
}

console.log(`
Now decide which of the names above are THIS game, and list those in
psnTitleNames. Include every spelling it goes by — the played-title name and the
trophy-list name usually differ. Leave out any name the lines above rule out, and
any that belongs to a different entry in the series.

Names match case- and trademark-insensitively, so "Rocket League®" and
"rocket league" are one entry; list each distinct spelling once.`);
