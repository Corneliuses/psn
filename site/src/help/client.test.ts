import { describe, expect, it, vi } from 'vitest';

import { HELP_OFFLINE_MESSAGE, HelpDeskError, askHelpDesk } from './client';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

describe('askHelpDesk', () => {
  it('posts the request to /api/chat and returns the answer', async () => {
    const answer = { kind: 'answer', answer: 'Dodge.', sources: [], searches: [] };
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json(answer));

    const result = await askHelpDesk({ question: 'How do I beat the Mantis?', game: 'Grounded 2' }, fetchMock as unknown as typeof fetch);

    expect(result).toEqual(answer);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/chat');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ question: 'How do I beat the Mantis?', game: 'Grounded 2' });
  });

  it('surfaces the server\'s error message on a non-2xx JSON response', async () => {
    const fetchMock = (async () => json({ error: 'Too many questions at once — give it a minute and try again.' }, 429)) as unknown as typeof fetch;
    await expect(askHelpDesk({ question: 'q' }, fetchMock)).rejects.toThrow(HelpDeskError);
    await expect(askHelpDesk({ question: 'q' }, fetchMock)).rejects.toThrow('Too many questions at once');
  });

  it('reports the help desk offline when the API answers with HTML (static host) or not at all', async () => {
    const html = (async () => new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html' } })) as unknown as typeof fetch;
    await expect(askHelpDesk({ question: 'q' }, html)).rejects.toThrow(HELP_OFFLINE_MESSAGE);

    const down = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    await expect(askHelpDesk({ question: 'q' }, down)).rejects.toThrow(HELP_OFFLINE_MESSAGE);
  });
});
