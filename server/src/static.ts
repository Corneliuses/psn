import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { createGzip } from 'node:zlib';

/*
 * Serves the built site (`site/dist`) next to the API so one container does
 * both. Mirrors what the nginx config used to do: hashed `/assets/` are
 * immutable, everything else falls back to `index.html` for react-router, and
 * text responses are gzipped when the client accepts it.
 */

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.webmanifest']);

export interface StaticHandler {
  /** Serve `req` from the directory; resolves false when nothing matched. */
  (req: IncomingMessage, res: ServerResponse): Promise<boolean>;
}

async function fileAt(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

export function createStaticHandler(rootDir: string): StaticHandler {
  const root = resolve(rootDir);
  const index = join(root, 'index.html');

  return async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return false;

    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://local').pathname);
    const candidate = resolve(root, `.${pathname}`);
    // Refuse anything that resolves outside the root (e.g. `/../package.json`).
    if (candidate !== root && !candidate.startsWith(root + sep)) return false;

    let file = candidate;
    if (!(await fileAt(file))) {
      // Only extension-less paths are routes; a missing asset is a real 404.
      if (extname(pathname) || !(await fileAt(index))) return false;
      file = index;
    }

    const ext = extname(file);
    res.setHeader('content-type', CONTENT_TYPES[ext] ?? 'application/octet-stream');
    res.setHeader(
      'cache-control',
      pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    );

    if (req.method === 'HEAD') {
      res.writeHead(200).end();
      return true;
    }

    const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
    if (gzip) {
      res.setHeader('content-encoding', 'gzip');
      res.setHeader('vary', 'accept-encoding');
    }
    res.writeHead(200);
    const stream = createReadStream(file);
    if (gzip) stream.pipe(createGzip()).pipe(res);
    else stream.pipe(res);
    await new Promise<void>((done) => res.once('finish', done).once('close', done));
    return true;
  };
}
