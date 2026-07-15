import { describe, expect, it, vi } from 'vitest';

import { withRetry } from '../src/psn/client.js';

const noSleep = () => Promise.resolve();

describe('withRetry', () => {
  it('returns immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(fn, { sleep: noSleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries transient failures (429, 5xx, network) until success', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Request failed with status 429'))
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValue('ok');
    await expect(withRetry(fn, { sleep: noSleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('gives up after the configured number of retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('503 Service Unavailable'));
    await expect(withRetry(fn, { retries: 2, sleep: noSleep })).rejects.toThrow('503');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-transient errors like auth failures', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toThrow('Invalid credentials');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
