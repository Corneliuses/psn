import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { SpeechReader } from '../help/speech';
import { ReadAloudButton } from './ReadAloudButton';

/** A fake reader that lets a test end the reading itself. */
function fakeSpeech() {
  let onDone: (() => void) | null = null;
  const speech: SpeechReader & { finish(): void } = {
    speak: vi.fn((_text, done) => {
      onDone = done;
    }),
    stop: vi.fn(() => {
      const done = onDone;
      onDone = null;
      done?.();
    }),
    finish() {
      const done = onDone;
      onDone = null;
      done?.();
    },
  };
  return speech;
}

describe('ReadAloudButton', () => {
  it('renders nothing when the browser has no speech synthesis', () => {
    // jsdom has no Web Speech API, so the default reader is null too.
    const { container } = render(<ReadAloudButton text="Dodge the lunge." />);
    expect(container).toBeEmptyDOMElement();
    render(<ReadAloudButton text="Dodge the lunge." speech={null} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('reads the text on click and offers to stop until the reading ends', async () => {
    const speech = fakeSpeech();
    const user = userEvent.setup();
    render(<ReadAloudButton text="Dodge the lunge." speech={speech} />);

    await user.click(screen.getByRole('button', { name: 'Read aloud' }));
    expect(speech.speak).toHaveBeenCalledWith('Dodge the lunge.', expect.any(Function));
    expect(screen.getByRole('button', { name: 'Stop reading' })).toBeInTheDocument();

    speech.finish();
    expect(await screen.findByRole('button', { name: 'Read aloud' })).toBeInTheDocument();
  });

  it('stops the reading when clicked again', async () => {
    const speech = fakeSpeech();
    const user = userEvent.setup();
    render(<ReadAloudButton text="Dodge the lunge." speech={speech} />);

    await user.click(screen.getByRole('button', { name: 'Read aloud' }));
    await user.click(screen.getByRole('button', { name: 'Stop reading' }));
    expect(speech.stop).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Read aloud' })).toBeInTheDocument();
  });

  it('stops the reading when unmounted mid-way, and not otherwise', async () => {
    const speech = fakeSpeech();
    const user = userEvent.setup();
    const idle = render(<ReadAloudButton text="Dodge the lunge." speech={speech} />);
    idle.unmount();
    expect(speech.stop).not.toHaveBeenCalled();

    const reading = render(<ReadAloudButton text="Dodge the lunge." speech={speech} />);
    await user.click(screen.getByRole('button', { name: 'Read aloud' }));
    reading.unmount();
    expect(speech.stop).toHaveBeenCalledTimes(1);
  });
});
