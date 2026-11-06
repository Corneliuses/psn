/*
 * A small fixed-window rate limiter: each key (a client IP) gets `limit` hits
 * per `windowMs`, and the whole server gets `globalLimit`. It is what makes the
 * help desk "controlled" on the cost side — one keyed Gemini call per allowed
 * request, and a hard ceiling on how many of those a minute can hold.
 *
 * In-memory on purpose: the site runs as a single container, and losing the
 * counters on restart is harmless.
 */

export interface RateLimiterOptions {
  /** Hits per key per window. */
  limit: number;
  /** Hits across all keys per window. */
  globalLimit: number;
  windowMs: number;
  /** Clock override for tests. */
  now?: () => number;
}

export interface RateLimiter {
  /** Record a hit for `key`; false when it (or the server) is over its limit. */
  allow(key: string): boolean;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const now = options.now ?? Date.now;
  let windowStart = now();
  let globalCount = 0;
  const counts = new Map<string, number>();

  const roll = (): void => {
    const current = now();
    if (current - windowStart >= options.windowMs) {
      windowStart = current;
      globalCount = 0;
      counts.clear();
    }
  };

  return {
    allow(key) {
      roll();
      if (globalCount >= options.globalLimit) return false;
      const count = counts.get(key) ?? 0;
      if (count >= options.limit) return false;
      counts.set(key, count + 1);
      globalCount += 1;
      return true;
    },
  };
}
