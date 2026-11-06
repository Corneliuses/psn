import { describe, expect, it, vi } from 'vitest';

import { createSpeechReader, type SpeechSynthesisLike, type UtteranceLike } from './speech';

// Handler arguments are `never` on the narrow type; these stand in for the browser's events.
const ended = {} as never;
const interrupted = { error: 'interrupted' } as never;

class FakeUtterance implements UtteranceLike {
  onend: ((event: never) => void) | null = null;
  onerror: ((event: never) => void) | null = null;
  constructor(readonly text: string) {}
}

/** A fake engine that records what it was asked to say and ends utterances on demand. */
function fakeSynth() {
  const spoken: FakeUtterance[] = [];
  const synth: SpeechSynthesisLike = {
    speak: vi.fn((utterance) => {
      spoken.push(utterance as unknown as FakeUtterance);
    }),
    cancel: vi.fn(() => {
      // Like a browser, cancelling reports the dropped utterances as errors.
      for (const utterance of spoken.splice(0)) utterance.onerror?.(interrupted);
    }),
  };
  return { synth, spoken };
}

describe('createSpeechReader', () => {
  it('returns null when the browser has no speech synthesis', () => {
    expect(createSpeechReader(undefined, undefined)).toBeNull();
    expect(createSpeechReader(fakeSynth().synth, undefined)).toBeNull();
  });

  it('speaks the text and reports once when the utterance ends', () => {
    const { synth, spoken } = fakeSynth();
    const reader = createSpeechReader(synth, FakeUtterance)!;
    const onDone = vi.fn();

    reader.speak('Dodge the lunge.', onDone);
    expect(synth.cancel).toHaveBeenCalledTimes(1);
    expect(spoken.map((u) => u.text)).toEqual(['Dodge the lunge.']);
    expect(onDone).not.toHaveBeenCalled();

    spoken[0]!.onend?.(ended);
    spoken[0]!.onerror?.(interrupted);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('stop cancels the engine and the cut-off utterance reports done', () => {
    const { synth } = fakeSynth();
    const reader = createSpeechReader(synth, FakeUtterance)!;
    const onDone = vi.fn();

    reader.speak('Dodge the lunge.', onDone);
    reader.stop();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('a second speak replaces the first, reporting the first as done', () => {
    const { synth, spoken } = fakeSynth();
    const reader = createSpeechReader(synth, FakeUtterance)!;
    const first = vi.fn();
    const second = vi.fn();

    reader.speak('First.', first);
    reader.speak('Second.', second);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(spoken.map((u) => u.text)).toEqual(['Second.']);

    spoken[0]!.onend?.(ended);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
