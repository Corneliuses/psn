import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    // The Playwright browser suite lives in e2e/ and its *.spec.ts files match
    // Vitest's default include — keep them out of the jsdom run (they're run by
    // `pnpm test:e2e`, not `pnpm test`).
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
