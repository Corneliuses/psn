const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/**
 * Format an ISO 8601 datetime as a short, human date, e.g.
 * "2026-07-14T19:12:00Z" → "Jul 14, 2026". Pinned to UTC so output is
 * deterministic regardless of the viewer's (or CI's) local timezone.
 */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}
