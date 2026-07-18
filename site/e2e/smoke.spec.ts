import { expect, test, type Page } from '@playwright/test';

import psnConfig from '../../psn.config.json' with { type: 'json' };

/**
 * Player keys come from psn.config.json (never hardcode them — see AGENTS.md),
 * so this smoke test tracks whichever players the site is configured for.
 */
const playerKeys: string[] = psnConfig.players.map((p) => p.key);

/** The four stat sections PlayerPage renders, as level-2 headings. */
const SECTION_HEADINGS = ['Recent games', 'Most played', 'Most trophies', 'Platinum games'];

/**
 * The placeholder fixture snapshots point game icons at https://image.example/…,
 * which does not resolve; those 404s are expected until real snapshots land in
 * #8. Any other console error or uncaught page error is a real regression.
 */
const isExpectedError = (text: string): boolean => text.includes('image.example');

/** Attach listeners that collect only the *unexpected* console/page errors. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isExpectedError(msg.text())) {
      errors.push(`console: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    if (!isExpectedError(err.message)) {
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

    await page.goto(`/${key}`);

    // All four section headings render (level-2 headings from SectionHeader).
    for (const heading of SECTION_HEADINGS) {
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
    }

    // At least one computed metric appears: a play-time duration (formatMinutes,
    // e.g. "210h 4m") or a trophy count (e.g. "66 trophies"). Either proves the
    // src/stats → data/*/latest.json path ran in a real browser.
    const metric = page.getByText(/\d+h \d+m|\d+ trophies/).first();
    await expect(metric).toBeVisible();

    // No unexpected console/page errors (placeholder image 404s are tolerated).
    expect(errors, `unexpected browser errors on /${key}`).toEqual([]);
  });
}
