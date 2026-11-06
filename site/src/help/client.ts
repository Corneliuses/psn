import type { ChatError, ChatRequest, ChatResponse } from 'chat-server/contract';

/*
 * The browser side of the help desk: one call to `POST /api/chat`. The server
 * (see `server/`) owns the Gemini key, the game-help-only guardrail and the
 * source contract; this file only ships the question and renders what comes
 * back, so nothing here can widen what the bot will answer.
 *
 * `VITE_CHAT_API_URL` points at a separately hosted server (e.g. when the
 * static site lives on Amplify); unset, the API is same-origin — the Docker
 * image serves both, and the Vite dev server proxies `/api` to it.
 */

export const CHAT_API_PATH = '/api/chat';

/** The user-facing reason a question could not be answered. */
export class HelpDeskError extends Error {
  override readonly name = 'HelpDeskError';
}

export const HELP_OFFLINE_MESSAGE = 'The help desk is offline right now — the chat server is not reachable from here.';

function apiBase(): string {
  const configured = import.meta.env.VITE_CHAT_API_URL;
  return typeof configured === 'string' ? configured.replace(/\/+$/, '') : '';
}

export async function askHelpDesk(request: ChatRequest, fetchImpl: typeof fetch = fetch): Promise<ChatResponse> {
  let response: Response;
  try {
    response = await fetchImpl(`${apiBase()}${CHAT_API_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new HelpDeskError(HELP_OFFLINE_MESSAGE);
  }

  // A static host with no API answers with its SPA fallback (HTML) or a 404 —
  // either way not JSON, which is how the UI learns the help desk is offline.
  const isJson = (response.headers.get('content-type') ?? '').includes('application/json');
  if (!isJson) throw new HelpDeskError(HELP_OFFLINE_MESSAGE);

  const body = (await response.json()) as ChatResponse | ChatError;
  if (!response.ok) {
    throw new HelpDeskError('error' in body && body.error ? body.error : 'Something went wrong answering that.');
  }
  return body as ChatResponse;
}
