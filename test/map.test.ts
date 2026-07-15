import { describe, expect, it } from 'vitest';

import { sampleRawResponses } from '../src/fixtures/sample.js';
import { mapPlayedTitle, mapTrophyTitle } from '../src/psn/map.js';

describe('mapPlayedTitle', () => {
  it('maps raw psn-api played titles to the domain model', () => {
    const raw = sampleRawResponses('dad').played.find((t) => t.titleId === 'PPSA07950_00')!;
    const mapped = mapPlayedTitle(raw);
    expect(mapped).toEqual({
      titleId: 'PPSA07950_00',
      name: 'Elden Ring',
      imageUrl: raw.imageUrl,
      category: 'ps5_native_game',
      playCount: 148,
      playDurationIso: 'PT210H3M44S',
      playDurationMinutes: 12_604,
      firstPlayed: raw.firstPlayedDateTime,
      lastPlayed: '2026-07-13T22:05:00Z',
    });
  });
});

describe('mapTrophyTitle', () => {
  it('maps raw trophy titles, deriving totals and the platinum flag', () => {
    const raw = sampleRawResponses('dad').trophies.find(
      (t) => t.npCommunicationId === 'NPWR22859_00',
    )!;
    const mapped = mapTrophyTitle(raw);
    expect(mapped.name).toBe('God of War Ragnarök');
    expect(mapped.earnedTotal).toBe(26 + 12 + 4 + 1);
    expect(mapped.hasPlatinum).toBe(true);
    expect(mapped.progress).toBe(89);
  });

  it('flags hasPlatinum=false when no platinum is earned even if one is defined', () => {
    const raw = sampleRawResponses('dad').trophies.find(
      (t) => t.npCommunicationId === 'NPWR23407_00',
    )!;
    expect(mapTrophyTitle(raw).hasPlatinum).toBe(false);
  });
});
