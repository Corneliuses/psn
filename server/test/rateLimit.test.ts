import { describe, expect, it } from 'vitest';

import { createRateLimiter } from '../src/rateLimit';

describe('createRateLimiter', () => {
  it('allows up to the per-key limit, then refuses until the window rolls', () => {
    let clock = 0;
    const limiter = createRateLimiter({ limit: 2, globalLimit: 10, windowMs: 1000, now: () => clock });

    expect(limiter.allow('a')).toBe(true);
    expect(limiter.allow('a')).toBe(true);
    expect(limiter.allow('a')).toBe(false);
    // Another key has its own budget.
    expect(limiter.allow('b')).toBe(true);

    clock = 1000;
    expect(limiter.allow('a')).toBe(true);
  });

  it('enforces the global ceiling across keys', () => {
    const limiter = createRateLimiter({ limit: 5, globalLimit: 3, windowMs: 1000, now: () => 0 });
    expect(limiter.allow('a')).toBe(true);
    expect(limiter.allow('b')).toBe(true);
    expect(limiter.allow('c')).toBe(true);
    expect(limiter.allow('d')).toBe(false);
  });
});
