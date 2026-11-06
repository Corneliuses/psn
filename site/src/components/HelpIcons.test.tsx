import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GuideIcon, PlayIcon, SparkIcon, SpeakerIcon, StopIcon } from './HelpIcons';

describe('HelpIcons', () => {
  it.each([
    ['SparkIcon', SparkIcon],
    ['GuideIcon', GuideIcon],
    ['PlayIcon', PlayIcon],
    ['SpeakerIcon', SpeakerIcon],
    ['StopIcon', StopIcon],
  ])('%s renders a decorative, unfocusable SVG that takes a class', (_name, Icon) => {
    const { container } = render(<Icon className="h-4 w-4 text-ps-blue-text" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveClass('h-4', 'w-4', 'text-ps-blue-text');
    // Nothing inside is exposed to assistive tech.
    expect(container.querySelector('[role]')).toBeNull();
  });
});
