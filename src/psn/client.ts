import type { AuthorizationPayload } from 'psn-api';

import { psnApi } from './api.js';

const { exchangeAccessCodeForAuthTokens, exchangeNpssoForAccessCode } = psnApi;

/** Thrown when PSN rejects our credentials; names the env var so the fix is obvious. */
export class PsnAuthError extends Error {
  constructor(
    public readonly envVar: string,
    cause?: unknown,
  ) {
    super(
      `PSN authentication failed for ${envVar}. The NPSSO token is likely expired — ` +
        `log in at playstation.com, visit https://ca.account.sony.com/api/v1/ssocookie, ` +
        `and update ${envVar} in your .env.`,
      { cause },
    );
    this.name = 'PsnAuthError';
  }
}

/**
 * Exchange an NPSSO token for an API authorization payload.
 * The token value is never logged or embedded in errors.
 */
export async function authenticate(npsso: string, envVar: string): Promise<AuthorizationPayload> {
  try {
    const accessCode = await exchangeNpssoForAccessCode(npsso);
    const tokens = await exchangeAccessCodeForAuthTokens(accessCode);
    return { accessToken: tokens.accessToken };
  } catch (cause) {
    throw new PsnAuthError(envVar, cause);
  }
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
}

function isTransient(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|rate.?limit|5\d\d|ECONNRESET|ETIMEDOUT|fetch failed|socket/i.test(message);
}

/**
 * Retry a PSN call on transient failures (rate limits, 5xx, network drops)
 * with exponential backoff. Auth and 4xx errors fail immediately.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransient(error) || attempt === retries) throw error;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw lastError;
}
