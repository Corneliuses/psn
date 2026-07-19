import { defineConfig, devices } from '@playwright/test';

/**
 * Browser-level smoke coverage for the built site.
 *
 * Unlike the jsdom Vitest suite, this drives the real production bundle: the
 * `webServer` below runs `vite build` then serves `dist/` via `vite preview`,
 * so a build-only break (e.g. a Node-only transitive import that breaks
 * `vite build` while every jsdom test stays green — see #5/#14) fails here.
 * Specs live in `e2e/` and are excluded from the Vitest `test` run.
 */
const PORT = 4173;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
