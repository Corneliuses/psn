import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The help desk's API lives in the chat-server package (`pnpm --filter
    // chat-server dev`, port 8787). Proxying it keeps the browser same-origin
    // in dev, exactly as the production container serves it.
    proxy: { '/api': 'http://localhost:8787' },
  },
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
