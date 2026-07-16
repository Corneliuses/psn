/*
 * A section heading fronted by a decorative PlayStation shape glyph. The glyph
 * rotates through △ ○ ✕ □ by `shapeIndex` so successive sections on a page each
 * get a different accent; it is purely decorative (`aria-hidden`) and colored
 * from the shape tokens. The heading text itself is the accessible name.
 */

const SHAPES = ['△', '○', '✕', '□'] as const;
const SHAPE_COLORS = [
  'text-shape-triangle',
  'text-shape-circle',
  'text-shape-cross',
  'text-shape-square',
] as const;

export interface SectionHeaderProps {
  title: string;
  /** Which PS shape accents this section; wraps around △ ○ ✕ □. */
  shapeIndex?: number;
  /** Heading level to render. Defaults to `h2`. */
  as?: 'h1' | 'h2' | 'h3';
}

export function SectionHeader({ title, shapeIndex = 0, as: Heading = 'h2' }: SectionHeaderProps) {
  const i = ((shapeIndex % SHAPES.length) + SHAPES.length) % SHAPES.length;

  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span aria-hidden="true" className={`text-xl leading-none ${SHAPE_COLORS[i]}`}>
        {SHAPES[i]}
      </span>
      <Heading className="text-2xl font-bold tracking-tight text-foreground">{title}</Heading>
    </div>
  );
}
