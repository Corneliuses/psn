import { formatMinutes } from 'psn/duration';
import type { PlaytimePoint } from 'psn/stats';

import { GlassCard } from './GlassCard';

/*
 * A compact, accessible playtime sparkline. The line + soft area fill are drawn
 * in a stretched viewBox (`preserveAspectRatio="none"`) with a non-scaling
 * stroke so it fills the card width at any size without distorting the line
 * weight. The chart itself is decorative geometry — the meaning lives in the
 * `role="img"` label, which reads the span and endpoints aloud. With fewer than
 * two points there is no line to draw, so it renders a complete, static
 * "not enough history yet" state (a normal state until snapshots accumulate).
 * No animation or timers, so it is safe and final under reduced motion / jsdom.
 */

const VIEW_W = 600;
const VIEW_H = 160;
const PAD = 10;

export interface TrendChartProps {
  points: PlaytimePoint[];
  /** Accent color as a CSS value for the line/area. Defaults to PS blue. */
  color?: string;
  /** What the trend measures, for the accessible label, e.g. "Playtime". */
  label: string;
}

export function TrendChart({ points, color = 'var(--color-ps-blue)', label }: TrendChartProps) {
  if (points.length < 2) {
    const only = points[0];
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-foreground-muted">
          Not enough history yet to chart {label.toLowerCase()} &mdash; the trend fills in as
          snapshots accumulate.
        </p>
        {only ? (
          <p className="mt-1 text-sm text-foreground-muted">
            Latest total: {formatMinutes(only.playtimeMinutes)}
          </p>
        ) : null}
      </GlassCard>
    );
  }

  const values = points.map((p) => p.playtimeMinutes);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const stepX = (VIEW_W - PAD * 2) / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: PAD + i * stepX,
    y: PAD + (VIEW_H - PAD * 2) * (1 - (p.playtimeMinutes - min) / span),
  }));

  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L ${coords[coords.length - 1]!.x.toFixed(1)} ${VIEW_H - PAD} L ${coords[0]!.x.toFixed(1)} ${VIEW_H - PAD} Z`;

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const description = `${label} trend across ${points.length} snapshots, from ${formatMinutes(
    first.playtimeMinutes,
  )} to ${formatMinutes(last.playtimeMinutes)}.`;

  return (
    <GlassCard className="p-5">
      <svg
        role="img"
        aria-label={description}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
      >
        <path d={area} fill={color} opacity={0.12} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </GlassCard>
  );
}
