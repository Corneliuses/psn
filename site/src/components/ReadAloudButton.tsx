import { useEffect, useRef, useState } from 'react';

import { createSpeechReader, type SpeechReader } from '../help/speech';
import { SpeakerIcon, StopIcon } from './HelpIcons';

/*
 * The one button under a help-desk answer that has the browser read it aloud.
 * It toggles: "Read aloud" starts, "Stop reading" cuts it off, and the label
 * follows whatever the engine is doing — so if another answer's button takes
 * over (there is only one voice), or the page is left, this one resets.
 *
 * It renders nothing where the browser has no speech synthesis, so the
 * feature never half-works: no button rather than a button that does nothing.
 * The thread is a live region, so the label change is what a screen-reader
 * user hears; there is no separate status text to duplicate it.
 */

export interface ReadAloudButtonProps {
  /** What to read — the answer only, never its sources. */
  text: string;
  /** The speech engine; injectable for tests. `null` hides the button. */
  speech?: SpeechReader | null;
  className?: string;
}

/** The browser's reader, built once on first use (and `null` in jsdom). */
let browserSpeech: SpeechReader | null | undefined;
function defaultSpeech(): SpeechReader | null {
  if (browserSpeech === undefined) browserSpeech = createSpeechReader();
  return browserSpeech;
}

export function ReadAloudButton({ text, speech, className = '' }: ReadAloudButtonProps) {
  const reader = speech === undefined ? defaultSpeech() : speech;
  const [reading, setReading] = useState(false);
  // Mirrors `reading` for the unmount cleanup below, which must only stop the
  // voice when it is this button's — stopping unconditionally would cut off
  // another answer that has since taken over.
  const readingRef = useRef(false);
  useEffect(() => {
    readingRef.current = reading;
  }, [reading]);

  // Leaving the page (or the thread re-rendering this answer away) stops the
  // voice rather than letting it carry on over whatever comes next.
  useEffect(() => {
    return () => {
      if (readingRef.current) reader?.stop();
    };
  }, [reader]);

  if (!reader) return null;

  function toggle(): void {
    if (!reader) return;
    if (reading) {
      reader.stop();
      return;
    }
    setReading(true);
    reader.speak(text, () => setReading(false));
  }

  const Icon = reading ? StopIcon : SpeakerIcon;
  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-sm font-semibold transition-colors ${
        reading
          ? 'border-ps-blue/60 bg-ps-blue/15 text-ps-blue-text'
          : 'border-border-subtle text-foreground-muted hover:border-border-strong hover:text-foreground'
      } ${className}`}
    >
      <Icon className="h-4 w-4" />
      {reading ? 'Stop reading' : 'Read aloud'}
    </button>
  );
}
