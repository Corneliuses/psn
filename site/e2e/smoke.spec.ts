import { expect, test, type Page } from '@playwright/test';

import psnConfig from '../../psn.config.json' with { type: 'json' };
import { companions } from '../src/companions';

/** Escape a game name so it can be matched literally inside a RegExp. */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Player keys come from psn.config.json (never hardcode them — see AGENTS.md),
 * so this smoke test tracks whichever players the site is configured for.
 */
const playerKeys: string[] = psnConfig.players.map((p) => p.key);

/** The four stat sections PlayerPage renders, as level-2 headings. */
const SECTION_HEADINGS = ['Recent games', 'Most played', 'Most trophies', 'Platinum games'];

/**
 * The placeholder fixture snapshots point game icons at https://image.example/…,
 * which does not resolve; those load failures are expected until real snapshots
 * land in #8. Any other console error or uncaught page error is a real
 * regression.
 *
 * A failed resource load surfaces as a console `error` whose *text* is generic
 * ("Failed to load resource: net::ERR_…") — the offending URL lives only in
 * `msg.location().url`. So the placeholder failures must be matched against the
 * location URL, not just the text, or the allowlist silently never matches.
 */
const PLACEHOLDER_IMAGE_HOST = 'image.example';
const isExpected = (...parts: string[]): boolean =>
  parts.some((p) => p.includes(PLACEHOLDER_IMAGE_HOST));

/** Attach listeners that collect only the *unexpected* console/page errors. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const url = msg.location().url;
    if (isExpected(msg.text(), url)) return;
    errors.push(`console: ${msg.text()}${url ? ` (${url})` : ''}`);
  });
  page.on('pageerror', (err) => {
    if (!isExpected(err.message)) {
      errors.push(`pageerror: ${err.message}`);
    }
  });
  return errors;
}

for (const key of playerKeys) {
  test(`player page /${key} renders its stat sections against the production build`, async ({
    page,
  }) => {
    const errors = collectErrors(page);

    // Wait for the network to settle so every load-time error (including the
    // tolerated placeholder-image failures) has actually surfaced before we
    // assert on `errors`; asserting after only `load` races those failures.
    await page.goto(`/${key}`, { waitUntil: 'networkidle' });

    // All four section headings render (level-2 headings from SectionHeader).
    for (const heading of SECTION_HEADINGS) {
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
    }

    // At least one computed metric appears: a play-time duration (formatMinutes,
    // e.g. "210h 4m") or a trophy count (e.g. "66 trophies"). Either proves the
    // src/stats → data/*/latest.json path ran in a real browser.
    const metric = page.getByText(/\d+h \d+m|\d+ trophies/).first();
    await expect(metric).toBeVisible();

    // No unexpected console/page errors (placeholder image load failures are
    // tolerated by host, real JS/render/asset errors are not).
    expect(errors, `unexpected browser errors on /${key}`).toEqual([]);
  });
}

/**
 * The companion apps (/together). Driven here rather than only in jsdom because
 * the map is a percentage-positioned layer over an SVG backdrop — real layout,
 * real hit-testing. Titles come from the companion registry, so this tracks
 * whichever games are registered.
 */
test('the together section lists every companion and opens one', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/together', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { level: 1, name: 'Together' })).toBeVisible();
  for (const companion of companions) {
    await expect(page.getByRole('link', { name: new RegExp(escapeRegExp(companion.name)) })).toBeVisible();
  }

  const first = companions[0]!;
  await page.getByRole('link', { name: new RegExp(escapeRegExp(first.name)) }).click();
  await expect(page.getByRole('heading', { level: 1, name: first.name })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Our time in this one' })).toBeVisible();

  expect(errors, 'unexpected browser errors on /together').toEqual([]);
});

test('a companion map filters its pins and reveals a pin note', async ({ page }) => {
  const mapped = companions.find((companion) => companion.map);
  test.skip(!mapped, 'no registered companion has a map module');
  const map = mapped!.map!;
  const pin = map.pins[0]!;
  const category = map.categories.find((c) => c.id === pin.categoryId)!;

  await page.goto(`/together/${mapped!.slug}`, { waitUntil: 'networkidle' });

  const pinButton = page.getByRole('button', { name: `${pin.name} — ${category.label}` });
  await expect(pinButton).toBeVisible();

  await pinButton.click();
  if (pin.note) await expect(page.getByText(pin.note)).toBeVisible();

  // Turning the pin's category off removes it from the map entirely.
  await page.getByRole('button', { name: category.label, exact: true }).click();
  await expect(pinButton).toBeHidden();
});
