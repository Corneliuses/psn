import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_GEMINI_MODEL, GEMINI_API_BASE, GeminiError, createGeminiClient } from '../src/gemini';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('createGeminiClient', () => {
  it('posts the system instruction, the contents and the search tool, keyed by header', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse({
        candidates: [
          {
            content: { parts: [{ thought: true, text: 'thinking…' }, { text: '{"answer":' }, { text: '"hi"}' }] },
            groundingMetadata: {
              groundingChunks: [{ web: { uri: 'https://a.example', title: 'A' } }, { web: { uri: 'https://b.example' } }, { retrievedContext: {} }],
              webSearchQueries: ['q1'],
            },
          },
        ],
      }),
    );
    const client = createGeminiClient({ apiKey: 'secret', fetch: fetchMock as unknown as typeof fetch });
    expect(client.model).toBe(DEFAULT_GEMINI_MODEL);

    const reply = await client.generate('be helpful', [{ role: 'user', parts: [{ text: 'hello' }] }]);

    expect(reply).toEqual({
      text: '{"answer":"hi"}',
      blocked: false,
      groundingChunks: [{ uri: 'https://a.example', title: 'A' }, { uri: 'https://b.example' }],
      webSearchQueries: ['q1'],
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${GEMINI_API_BASE}/models/${DEFAULT_GEMINI_MODEL}:generateContent`);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('secret');
    expect(url).not.toContain('secret');
    const body = JSON.parse(init.body as string);
    expect(body.systemInstruction).toEqual({ parts: [{ text: 'be helpful' }] });
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'hello' }] }]);
    expect(body.tools).toEqual([{ googleSearch: {} }]);
  });

  it('uses the configured model and base URL', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({ candidates: [] }));
    const client = createGeminiClient({
      apiKey: 'k',
      model: 'gemini-x',
      apiBase: 'https://proxy.example/v1',
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.generate('s', []);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://proxy.example/v1/models/gemini-x:generateContent');
  });

  it('reports a blocked prompt or a safety-stopped candidate as blocked', async () => {
    const blockedPrompt = createGeminiClient({
      apiKey: 'k',
      fetch: (async () => jsonResponse({ promptFeedback: { blockReason: 'SAFETY' } })) as unknown as typeof fetch,
    });
    expect((await blockedPrompt.generate('s', [])).blocked).toBe(true);

    const safetyStop = createGeminiClient({
      apiKey: 'k',
      fetch: (async () => jsonResponse({ candidates: [{ finishReason: 'SAFETY', content: { parts: [] } }] })) as unknown as typeof fetch,
    });
    expect((await safetyStop.generate('s', [])).blocked).toBe(true);
  });

  it('wraps HTTP errors without echoing the body', async () => {
    const client = createGeminiClient({
      apiKey: 'k',
      fetch: (async () => jsonResponse({ error: { message: 'key=k leaked' } }, 403)) as unknown as typeof fetch,
    });
    await expect(client.generate('s', [])).rejects.toThrow(GeminiError);
    await expect(client.generate('s', [])).rejects.toThrow('Gemini responded 403');
    await expect(client.generate('s', [])).rejects.not.toThrow('leaked');
  });

  it('wraps network failures', async () => {
    const client = createGeminiClient({
      apiKey: 'k',
      fetch: (async () => {
        throw new TypeError('fetch failed');
      }) as unknown as typeof fetch,
    });
    await expect(client.generate('s', [])).rejects.toThrow('Gemini request failed: fetch failed');
  });
});
