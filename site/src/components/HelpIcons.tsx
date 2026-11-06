import type { SVGProps } from 'react';

/*
 * The help desk's glyphs, as inline SVG so they take the current text color
 * (token utilities like `text-ps-blue-text`) and need no icon font or asset.
 * All are decorative: `aria-hidden`, with the meaning carried by the text
 * beside them ("AI", "Guide", "Video", "Read aloud"). Original drawings — no
 * brand marks: the play glyph is a plain triangle in a rounded tile, not a logo.
 */

type IconProps = Omit<SVGProps<SVGSVGElement>, 'aria-hidden' | 'focusable'>;

const base = { 'aria-hidden': true, focusable: false, fill: 'none', viewBox: '0 0 24 24' } as const;

/** A sparkle cluster — the AI signifier on the hero, the badge and the busy state. */
export function SparkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"
        fill="currentColor"
      />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" fill="currentColor" opacity="0.75" />
      <path d="M5 2l.7 1.6L7.3 4.3 5.7 5 5 6.6 4.3 5 2.7 4.3l1.6-.7L5 2z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/** A written page with text lines — the guide / article source. */
export function GuideIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M7 3h7l5 5v13H7V3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 12h6M10 15.5h6M10 19h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** A play triangle in a rounded tile — the video source. */
export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="4" fill="currentColor" />
      <path d="M10 9.2v5.6l5-2.8-5-2.8z" fill="var(--color-surface-0)" />
    </svg>
  );
}

/** A speaker with sound waves — the read-aloud button. */
export function SpeakerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5z" fill="currentColor" />
      <path
        d="M15.5 9a4.2 4.2 0 010 6M18.3 6.5a8 8 0 010 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A plain rounded square — the stop glyph on the read-aloud button while it reads. */
export function StopIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
    </svg>
  );
}
