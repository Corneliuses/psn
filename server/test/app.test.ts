import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp, type AppOptions } from '../src/app';
import type { ChatRequest } from '../src/contract';
import { GeminiError, type GeminiClient, type GeminiReply } from '../src/gemini';
import { SYSTEM_INSTRUCTION } from '../src/help';

const ARTICLE = 'https://grounded.fandom.com/wiki/Mantis';
const VIDEO = 'https://www.youtube.com/watch?v=abc123';

const okReply: GeminiReply = {
  text: JSON.stringify({ onTopic: true, answer: 'Dodge the lunge.', sources: [{ title: 'Wiki', url: ARTICLE }, { title: 'Clip', url: VIDEO }] }),
  blocked: false,
  groundingChunks: [],
  webSearchQueries: ['mantis'],
};

function fakeGemini(impl: GeminiClient['generate'] = async () => okReply): GeminiClient & { generate: ReturnType<typeof vi.fn> } {
  return { model: 'fake-model', generate: vi.fn(impl) } as GeminiClient & { generate: ReturnType<typeof vi.fn> };
}

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((done) => server.close(done))));
});

async function start(options: AppOptions): Promise<string> {
  const app = createApp({ log: () => {}, ...options });
  const server = createServer((req, res) => void app(req, res));
  servers.push(server);
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('no port');
  return `http://127.0.0.1:${address.port}`;
}

const ask = (base: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('POST /api/chat', () => {
  it('answers a game question with the guardrail prompt and both source kinds', async () => {
    const gemini = fakeGemini();
    const base = await start({ gemini });

    const request: ChatRequest = { question: 'How do I beat the Mantis?', game: 'Grounded 2' };
    const response = await ask(base, request);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      kind: 'answer',
      answer: 'Dodge the lunge.',
      sources: [
        { title: 'Wiki', url: ARTICLE, kind: 'article' },
        { title: 'Clip', url: VIDEO, kind: 'video' },
      ],
      searches: ['mantis'],
    });
    expect(gemini.generate).toHaveBeenCalledWith(SYSTEM_INSTRUCTION, [
      { role: 'user', parts: [{ text: 'Game: Grounded 2\nQuestion: How do I beat the Mantis?' }] },
    ]);
  });

  it('declines off-topic questions', async () => {
    const base = await start({
      gemini: fakeGemini(async () => ({ ...okReply, text: '{"onTopic": false, "answer": "Game questions only.", "sources": []}' })),
    });
    const response = await ask(base, { question: 'What is the capital of France?' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ kind: 'off-topic', answer: 'Game questions only.' });
  });

  it('rejects a bad body before spending a model call', async () => {
    const gemini = fakeGemini();
    const base = await start({ gemini });

    expect((await ask(base, { question: '' })).status).toBe(400);
    expect((await ask(base, 'not json')).status).toBe(400);
    expect((await ask(base, { question: 'x'.repeat(20_000) })).status).toBe(400);
    expect((await ask(base, { question: 'x'.repeat(70_000) })).status).toBe(413);
    expect(gemini.generate).not.toHaveBeenCalled();
  });

  it('only accepts POST', async () => {
    const base = await start({ gemini: fakeGemini() });
    const response = await fetch(`${base}/api/chat`);
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });

  it('rate-limits per client and never calls the model when over the limit', async () => {
    const gemini = fakeGemini();
    const base = await start({ gemini, rateLimitPerMinute: 2, trustProxy: true });

    expect((await ask(base, { question: 'q' }, { 'x-forwarded-for': '1.1.1.1' })).status).toBe(200);
    expect((await ask(base, { question: 'q' }, { 'x-forwarded-for': '1.1.1.1' })).status).toBe(200);
    // The proxy appends the caller last; an address the caller put in front
    // of it is not a new client.
    const limited = await ask(base, { question: 'q' }, { 'x-forwarded-for': '10.0.0.1, 1.1.1.1' });
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('60');
    expect(((await limited.json()) as { error: string }).error).toMatch(/give it a minute/);
    // A different client still gets through.
    expect((await ask(base, { question: 'q' }, { 'x-forwarded-for': '2.2.2.2' })).status).toBe(200);
    expect(gemini.generate).toHaveBeenCalledTimes(3);
  });

  it('keys on the Lambda request context when the Web Adapter relays one', async () => {
    const gemini = fakeGemini();
    const base = await start({ gemini, rateLimitPerMinute: 2, trustProxy: true });
    const context = (sourceIp: string) => ({ 'x-amzn-request-context': JSON.stringify({ http: { sourceIp } }) });

    expect((await ask(base, { question: 'q' }, context('1.1.1.1'))).status).toBe(200);
    // The function URL passes a caller's X-Forwarded-For through untouched, so
    // it must not outrank the address the platform reports.
    expect((await ask(base, { question: 'q' }, { ...context('1.1.1.1'), 'x-forwarded-for': '5.5.5.5' })).status).toBe(200);
    expect((await ask(base, { question: 'q' }, { ...context('1.1.1.1'), 'x-forwarded-for': '6.6.6.6' })).status).toBe(429);
    expect((await ask(base, { question: 'q' }, context('2.2.2.2'))).status).toBe(200);
    // A malformed context falls back rather than crashing.
    expect((await ask(base, { question: 'q' }, { 'x-amzn-request-context': '{not json' })).status).toBe(200);
    expect(gemini.generate).toHaveBeenCalledTimes(4);
  });

  it('ignores X-Forwarded-For unless a trusted proxy is declared', async () => {
    const gemini = fakeGemini();
    const base = await start({ gemini, rateLimitPerMinute: 2 });

    // Every request comes from the test's own socket, so forging the header
    // does not mint a fresh budget.
    expect((await ask(base, { question: 'q' }, { 'x-forwarded-for': '1.1.1.1' })).status).toBe(200);
    expect((await ask(base, { question: 'q' }, { 'x-forwarded-for': '2.2.2.2' })).status).toBe(200);
    expect((await ask(base, { question: 'q' }, { 'x-forwarded-for': '3.3.3.3' })).status).toBe(429);
    expect(gemini.generate).toHaveBeenCalledTimes(2);
  });

  it('accepts a request that fills every CHAT_LIMITS field, in a 3-byte script', async () => {
    const gemini = fakeGemini();
    const base = await start({ gemini });
    const cjk = (n: number) => '漢'.repeat(n);
    const history = Array.from({ length: 6 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: cjk(2000) }));
    const response = await ask(base, { question: cjk(500), game: cjk(100), history });
    expect(response.status).toBe(200);
    expect(gemini.generate).toHaveBeenCalledTimes(1);
  });

  it('maps an upstream failure to 502 with a friendly message', async () => {
    const base = await start({
      gemini: fakeGemini(async () => {
        throw new GeminiError('Gemini responded 500', 500);
      }),
    });
    const response = await ask(base, { question: 'q' });
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'The help desk could not reach its model. Try again shortly.' });
  });

  it('maps an unexpected failure to 500', async () => {
    const base = await start({
      gemini: fakeGemini(async () => {
        throw new Error('boom');
      }),
    });
    expect((await ask(base, { question: 'q' })).status).toBe(500);
  });

  it('answers CORS preflight only for a listed origin', async () => {
    const open = await start({ gemini: fakeGemini(), allowedOrigins: ['https://site.example', 'https://www.site.example'] });
    const preflight = await fetch(`${open}/api/chat`, { method: 'OPTIONS', headers: { origin: 'https://www.site.example' } });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('https://www.site.example');

    const answered = await ask(open, { question: 'q' }, { origin: 'https://site.example' });
    expect(answered.headers.get('access-control-allow-origin')).toBe('https://site.example');

    const stranger = await fetch(`${open}/api/chat`, { method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
    expect(stranger.status).toBe(204);
    expect(stranger.headers.get('access-control-allow-origin')).toBeNull();

    const closed = await start({ gemini: fakeGemini() });
    const response = await fetch(`${closed}/api/chat`, { method: 'OPTIONS' });
    expect(response.status).toBe(405);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('GET /api/health', () => {
  it('reports the model', async () => {
    const base = await start({ gemini: fakeGemini() });
    const response = await fetch(`${base}/api/health`);
    expect(await response.json()).toEqual({ ok: true, model: 'fake-model' });
  });

  it('404s unknown API paths as JSON', async () => {
    const base = await start({ gemini: fakeGemini() });
    const response = await fetch(`${base}/api/nope`);
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
  });
});

describe('static site', () => {
  async function siteDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'chat-server-site-'));
    await writeFile(join(dir, 'index.html'), '<!doctype html><title>PSN Stats</title>');
    await mkdir(join(dir, 'assets'));
    await writeFile(join(dir, 'assets', 'app.js'), 'console.log(1)');
    return dir;
  }

  it('serves files, hashed assets as immutable, and falls back to index.html for routes', async () => {
    const base = await start({ gemini: fakeGemini(), staticDir: await siteDir() });

    const index = await fetch(base);
    expect(index.status).toBe(200);
    expect(index.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(index.headers.get('cache-control')).toBe('no-cache');
    expect(await index.text()).toContain('PSN Stats');

    const asset = await fetch(`${base}/assets/app.js`);
    expect(asset.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(asset.headers.get('content-type')).toBe('text/javascript; charset=utf-8');

    const route = await fetch(`${base}/together/grounded-2`);
    expect(route.status).toBe(200);
    expect(await route.text()).toContain('PSN Stats');

    expect((await fetch(`${base}/assets/missing.js`)).status).toBe(404);
  });

  it('gzips text when the client accepts it', async () => {
    const base = await start({ gemini: fakeGemini(), staticDir: await siteDir() });
    // Node's fetch decompresses transparently, so inspect the raw bytes via http.
    const raw = await new Promise<{ encoding: string | undefined; body: Buffer }>((resolve, reject) => {
      import('node:http').then(({ get }) => {
        get(`${base}/index.html`, { headers: { 'accept-encoding': 'gzip' } }, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => resolve({ encoding: res.headers['content-encoding'], body: Buffer.concat(chunks) }));
          res.on('error', reject);
        });
      });
    });
    expect(raw.encoding).toBe('gzip');
    expect(gunzipSync(raw.body).toString()).toContain('PSN Stats');
  });

  it('never serves outside the static root', async () => {
    const base = await start({ gemini: fakeGemini(), staticDir: await siteDir() });
    const response = await fetch(`${base}/..%2F..%2Fetc%2Fpasswd`);
    expect(response.status).toBe(404);
  });

  it('404s everything but the API when no static dir is configured', async () => {
    const base = await start({ gemini: fakeGemini() });
    expect((await fetch(base)).status).toBe(404);
  });
});
