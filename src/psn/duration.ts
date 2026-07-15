const DURATION_RE =
  /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

/**
 * Parse the ISO 8601 durations PSN emits (e.g. "PT228H56M33S", "PT2M",
 * "P1DT3H") into whole minutes, rounded to nearest. PSN never emits
 * year/month/week components, so those are rejected rather than guessed at.
 */
export function durationToMinutes(iso: string): number {
  const match = DURATION_RE.exec(iso);
  if (!match) {
    throw new Error(`Unsupported ISO 8601 duration: "${iso}"`);
  }
  const [, days, hours, minutes, seconds] = match;
  const totalSeconds =
    Number(days ?? 0) * 86_400 +
    Number(hours ?? 0) * 3_600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0);
  return Math.round(totalSeconds / 60);
}

/** Format minutes as a human string, e.g. 13737 → "228h 57m". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
