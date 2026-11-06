/*
 * Reading a help-desk answer aloud with the browser's own speech synthesis
 * (the Web Speech API) — no network, no key, nothing sent anywhere.
 *
 * `SpeechReader` is the small surface the UI needs: start reading one piece of
 * text (replacing whatever was being read), and stop. The browser-backed
 * implementation is built by `createSpeechReader`, which returns `null` where
 * the API is missing (older browsers, jsdom) so the UI can simply not offer
 * the button. Tests inject a fake reader instead of stubbing the globals.
 */

export interface SpeechReader {
  /**
   * Starts reading `text` aloud, cutting off anything already being read.
   * `onDone` fires once when reading stops for any reason — it finished, it
   * was stopped, it was replaced by another `speak`, or the browser failed.
   */
  speak(text: string, onDone: () => void): void;
  /** Stops reading; a no-op when nothing is being read. */
  stop(): void;
}

/** The subset of `SpeechSynthesis` the reader uses — narrow so a fake is trivial. */
export type SpeechSynthesisLike = Pick<SpeechSynthesis, 'speak' | 'cancel'>;

/**
 * The subset of `SpeechSynthesisUtterance` the reader sets. The handlers take
 * `never` so the browser's own event-typed ones satisfy it while the reader
 * only ever installs no-argument callbacks.
 */
export interface UtteranceLike {
  onend: ((event: never) => void) | null;
  onerror: ((event: never) => void) | null;
}

export type UtteranceConstructor = new (text: string) => UtteranceLike;

/**
 * Builds a reader over the Web Speech API, or returns `null` when the browser
 * has none. Pass `synth` and `Utterance` to build one over fakes.
 */
export function createSpeechReader(
  synth: SpeechSynthesisLike | undefined = globalThis.speechSynthesis,
  Utterance: UtteranceConstructor | undefined = globalThis.SpeechSynthesisUtterance,
): SpeechReader | null {
  if (!synth || typeof Utterance !== 'function') return null;

  // The utterance being read. Kept here, not only in the engine's queue, for
  // two reasons: so `onDone` is only reported for the utterance that is still
  // current (a replaced one is reported when `cancel` fires its end/error),
  // and because some engines drop callbacks on an utterance nothing references.
  let current: UtteranceLike | null = null;

  return {
    speak(text, onDone) {
      // `cancel` first: without it engines queue the new utterance behind the
      // old one instead of replacing it.
      synth.cancel();
      const utterance = new Utterance(text);
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        if (current === utterance) current = null;
        onDone();
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      current = utterance;
      synth.speak(utterance as SpeechSynthesisUtterance);
    },
    stop() {
      synth.cancel();
    },
  };
}
