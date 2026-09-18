#!/usr/bin/env node
/*
 * shoot-companion — build the site, screenshot a companion page, and check it
 * does not overflow horizontally.
 *
 * Step 6 of the skill asks you to look at the page, because the failures there
 * are visual: colliding map pins, a table wider than a phone, a tagline that
 * wraps badly. Assertions do not catch those, and "open it in a browser" is not
 * something an agent can do. This does the equivalent and leaves PNGs behind.
 *
 * Usage:
 *   node .claude/skills/add-companion-app/scripts/shoot-companion.mjs <slug> [outDir]
 *
 * Writes <slug>-1280.png, <slug>-390.png and together-1280.png to outDir
 * (default: a temp directory, path printed at the end), and exits non-zero if
 * either page scrolls sideways at any width.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const slug = (process.argv[2] ?? '').trim();
const outDir = process.argv[3] ?? mkdtempSync(join(tmpdir(), 'companion-shots-'));
const PORT = 4183;
const BASE = `http://localhost:${PORT}`;

if (!slug) {
  console.error('Usage: node .../shoot-companion.mjs <slug> [outDir]');
  process.exit(1);
}

/*
 * Playwright is a devDependency of the `site` workspace, not the root, so it
 * only resolves from there — resolving from the repo root fails.
 */
const require = createRequire(join(REPO_ROOT, 'site', 'package.json'));
let chromium;
try {
  // @playwright/test is CommonJS, so require it rather than dynamic-import it:
  // `import()` of a CJS module puts the exports on `.default`, not on named ones.
  const playwright = require('@playwright/test');
  chromium = playwright.chromium ?? playwright.default?.chromium;
  if (!chromium) throw new Error('no chromium export');
} catch {
  console.error('Could not load @playwright/test from site/. Run `pnpm install` first.');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: REPO_ROOT, stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    child.on('error', reject);
  });
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Preview server never came up at ${url}`);
}

console.log('Building the site…');
await run('pnpm', ['--filter', 'site', 'build']);

console.log(`Serving dist/ on ${BASE}…`);
const server = spawn('pnpm', ['--filter', 'site', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: REPO_ROOT,
  stdio: 'ignore',
  detached: true,
});

const shots = [];
let overflowed = false;

try {
  await waitForServer(BASE);
  const browser = await chromium.launch();

  /* Desktop and a small phone. 390px is an iPhone-class width; the map pins and
     the guide tables are what break first, and only at the narrow end. */
  for (const [path, name, width, height] of [
    ['/together', 'together', 1280, 900],
    [`/together/${slug}`, slug, 1280, 2000],
    [`/together/${slug}`, slug, 390, 1400],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const res = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    if (res && res.status() >= 400) throw new Error(`${path} returned ${res.status()}`);
    await page.waitForTimeout(700); // let entrance animations settle

    const heading = await page.locator('h1').first().textContent();
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    const overflow = scrollWidth > clientWidth;
    if (overflow) overflowed = true;

    const file = join(outDir, `${name}-${width}.png`);
    await page.screenshot({ path: file, fullPage: width >= 1280 });
    shots.push({ path, width, heading: (heading ?? '').trim(), overflow, file });
    await page.close();
  }

  await browser.close();
} finally {
  try {
    process.kill(-server.pid);
  } catch {
    // already gone
  }
}

console.log('\n=== results ===');
for (const s of shots) {
  console.log(
    `${s.path.padEnd(30)} ${String(s.width).padStart(4)}px  h1=${JSON.stringify(s.heading)}` +
      `  ${s.overflow ? 'HORIZONTAL OVERFLOW' : 'fits'}`,
  );
  console.log(`    ${s.file}`);
}

console.log(`
Now READ the images — the overflow check only catches the page scrolling
sideways. Look for map pins overlapping each other or a zone label, a tagline
wrapping onto three lines, and a guide table cramped at 390px. Pin pills are
sized by their text, so a long pin name is the usual cause.`);

if (overflowed) {
  console.error('\nAt least one page scrolls sideways. Fix that before committing.');
  process.exit(1);
}
