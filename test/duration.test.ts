import { describe, expect, it } from 'vitest';

import { durationToMinutes, formatMinutes } from '../src/psn/duration.js';

describe('durationToMinutes', () => {
  it('parses the full H/M/S shape PSN typically emits', () => {
    expect(durationToMinutes('PT228H56M33S')).toBe(13_737); // 13736.55 → rounds up
  });

  it('parses hour-only, minute-only, and second-only durations', () => {
    expect(durationToMinutes('PT10H')).toBe(600);
    expect(durationToMinutes('PT2M')).toBe(2);
    expect(durationToMinutes('PT45S')).toBe(1); // rounds to nearest
    expect(durationToMinutes('PT20S')).toBe(0);
  });

  it('parses durations with a day component', () => {
    expect(durationToMinutes('P1DT2H')).toBe(1_560);
  });

  it('parses zero and fractional seconds', () => {
    expect(durationToMinutes('PT0S')).toBe(0);
    expect(durationToMinutes('PT1M30.5S')).toBe(2);
  });

  it('rejects shapes PSN never emits rather than guessing', () => {
    expect(() => durationToMinutes('P1Y')).toThrow(/Unsupported/);
    expect(() => durationToMinutes('P2W')).toThrow(/Unsupported/);
    expect(() => durationToMinutes('nonsense')).toThrow(/Unsupported/);
    expect(() => durationToMinutes('')).toThrow(/Unsupported/);
  });
});

describe('formatMinutes', () => {
  it('formats sub-hour and multi-hour values', () => {
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(600)).toBe('10h 0m');
    expect(formatMinutes(13_737)).toBe('228h 57m');
  });
});
