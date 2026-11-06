import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp } from './app';
import { DEFAULT_GEMINI_MODEL, createGeminiClient } from './gemini';

/*
 * Process entrypoint. Configuration is environment only:
 *
 *   GEMINI_API_KEY                   required — the key the browser must never see
 *   GEMINI_MODEL                     default gemini-3.8-flash
 *   PORT                             default 8787 (Cloud Run sets 8080)
 *   STATIC_DIR                       serve the built site from here (unset = API only)
 *   CHAT_RATE_LIMIT_PER_MINUTE       per-client cap, default 10
 *   CHAT_GLOBAL_RATE_LIMIT_PER_MINUTE server-wide cap, default 60
 *   CHAT_ALLOWED_ORIGIN              CORS origin(s), comma-separated, for a site hosted elsewhere (e.g. Amplify)
 *   CHAT_TRUST_PROXY                 "1" when a trusted proxy appends the caller to X-Forwarded-For
 *                                    (the Lambda function URL); unset, the socket address keys the rate limit
 *
 * Locally, `.env` at the repo root is loaded when present — the same file that
 * holds the sync tokens, so one secrets file serves both tools.
 */

const envFile = resolve(process.cwd(), '.env');
const rootEnvFile = resolve(process.cwd(), '..', '.env');
for (const file of [envFile, rootEnvFile]) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
    break;
  }
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set — the help desk cannot answer without it (see README).');
  process.exit(1);
}

const intEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  const value = raw === undefined ? NaN : Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const port = intEnv('PORT', 8787);
const staticDir = process.env.STATIC_DIR;
const allowedOrigins = (process.env.CHAT_ALLOWED_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const app = createApp({
  gemini: createGeminiClient({ apiKey, model: process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL }),
  ...(staticDir ? { staticDir } : {}),
  ...(allowedOrigins.length ? { allowedOrigins } : {}),
  rateLimitPerMinute: intEnv('CHAT_RATE_LIMIT_PER_MINUTE', 10),
  globalRateLimitPerMinute: intEnv('CHAT_GLOBAL_RATE_LIMIT_PER_MINUTE', 60),
  trustProxy: ['1', 'true', 'yes'].includes((process.env.CHAT_TRUST_PROXY ?? '').trim().toLowerCase()),
});

createServer((req, res) => {
  app(req, res).catch((error: unknown) => {
    console.error('request failed', error);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
}).listen(port, () => {
  const model = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  console.log(
    `chat-server listening on :${port} (model ${model}${staticDir ? `, serving ${staticDir}` : ', API only'})`,
  );
});
