import type { IncomingMessage, ServerResponse } from 'node:http';

import type { ChatError, ChatResponse } from './contract';
import { GeminiError, type GeminiClient } from './gemini';
import { BadRequestError, SYSTEM_INSTRUCTION, buildContents, parseChatRequest, toChatResponse } from './help';
import { createRateLimiter, type RateLimiter } from './rateLimit';
import { createStaticHandler, type StaticHandler } from './static';

/*
 * The HTTP layer, as a plain `node:http` request handler so it needs no
 * framework and can be mounted on a server in tests. Routes:
 *
 *   GET  /api/health  → { ok, model }
 *   POST /api/chat    → ChatResponse (see contract.ts)
 *   GET  *            → the built site, when `staticDir` is set
 *
 * The Gemini key never leaves this process: the browser only ever talks to
 * `/api/chat`, which applies the guardrail prompt and the rate limit before
 * spending a model call.
 */

export const CHAT_PATH = '/api/chat';
export const HEALTH_PATH = '/api/health';
const MAX_BODY_BYTES = 16 * 1024;

export interface AppOptions {
  gemini: GeminiClient;
  /** Directory of the built site to serve beside the API; omit for API-only. */
  staticDir?: string;
  /** Requests per client IP per minute. */
  rateLimitPerMinute?: number;
  /** Requests across all clients per minute. */
  globalRateLimitPerMinute?: number;
  rateLimiter?: RateLimiter;
  /** Origin allowed to call the API cross-site (the dev server proxies instead, so usually unset). */
  allowedOrigin?: string;
  log?: (message: string) => void;
}

export type RequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

/** Thrown when the body is too large or not JSON; mapped to HTTP 400/413. */
class BodyError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413,
  ) {
    super(message);
  }
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = chunk as Buffer;
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new BodyError('Request body too large', 413);
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new BodyError('Request body must be JSON', 400);
  }
}

/** The client IP, honouring the proxy header Cloud Run and friends set. */
export function clientKey(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

function sendJson(res: ServerResponse, status: number, body: ChatResponse | ChatError | Record<string, unknown>): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

export function createApp(options: AppOptions): RequestHandler {
  const log = options.log ?? ((message: string) => console.log(message));
  const limiter =
    options.rateLimiter ??
    createRateLimiter({
      limit: options.rateLimitPerMinute ?? 10,
      globalLimit: options.globalRateLimitPerMinute ?? 60,
      windowMs: 60_000,
    });
  const serveStatic: StaticHandler | undefined = options.staticDir ? createStaticHandler(options.staticDir) : undefined;

  const applyCors = (req: IncomingMessage, res: ServerResponse): boolean => {
    if (!options.allowedOrigin) return false;
    res.setHeader('access-control-allow-origin', options.allowedOrigin);
    res.setHeader('vary', 'origin');
    if (req.method !== 'OPTIONS') return false;
    res.writeHead(204, {
      'access-control-allow-methods': 'POST, GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '600',
    });
    res.end();
    return true;
  };

  const handleChat = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST');
      sendJson(res, 405, { error: 'Use POST' });
      return;
    }
    if (!limiter.allow(clientKey(req))) {
      res.setHeader('retry-after', '60');
      sendJson(res, 429, { error: 'Too many questions at once — give it a minute and try again.' });
      return;
    }

    try {
      const request = parseChatRequest(await readJsonBody(req));
      const reply = await options.gemini.generate(SYSTEM_INSTRUCTION, buildContents(request));
      const response = toChatResponse(reply, request);
      log(`chat ${response.kind} game=${JSON.stringify(request.game ?? '')} chars=${request.question.length}`);
      sendJson(res, 200, response);
    } catch (error) {
      if (error instanceof BodyError) sendJson(res, error.status, { error: error.message });
      else if (error instanceof BadRequestError) sendJson(res, 400, { error: error.message });
      else if (error instanceof GeminiError) {
        log(`chat upstream error: ${error.message}`);
        sendJson(res, 502, { error: 'The help desk could not reach its model. Try again shortly.' });
      } else {
        log(`chat unexpected error: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
        sendJson(res, 500, { error: 'Something went wrong answering that.' });
      }
    }
  };

  return async (req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://local').pathname;

    if (pathname.startsWith('/api/')) {
      if (applyCors(req, res)) return;
      if (pathname === CHAT_PATH) return handleChat(req, res);
      if (pathname === HEALTH_PATH) return sendJson(res, 200, { ok: true, model: options.gemini.model });
      return sendJson(res, 404, { error: 'Not found' });
    }

    if (serveStatic && (await serveStatic(req, res))) return;
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  };
}
