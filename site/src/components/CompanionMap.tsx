import { useState } from 'react';

import type { CompanionMapContent, MapPin } from '../companions/types';
import { toneStyle } from '../config/tones';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';

/*
 * The interactive map module: a hand-drawn, original SVG backdrop (abstract
 * zones — never game art) with pins positioned in percentage coordinates on top.
 *
 * Interaction is deliberately plain so it works on a phone with one thumb and on
 * a keyboard: category chips filter which pins show, and selecting a pin reveals
 * its note in a live region below the map. Pins are real <button>s in DOM order,
 * so tabbing walks them and a screen reader announces each one by name and
 * category. Nothing here animates, so there is no reduced-motion branch — the
 * only motion is a CSS hover lift behind `motion-safe:`.
 */

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 62;

/** Percent-of-box (the pin coordinate space) → the SVG backdrop's viewBox. */
function toViewBox(xPercent: number, yPercent: number): { x: number; y: number } {
  return { x: (xPercent / 100) * VIEW_WIDTH, y: (yPercent / 100) * VIEW_HEIGHT };
}

export interface CompanionMapProps {
  map: CompanionMapContent;
  /** Which PS shape accents the section header; wraps around △ ○ ✕ □. */
  shapeIndex?: number;
}

export function CompanionMap({ map, shapeIndex = 0 }: CompanionMapProps) {
  const allCategoryIds = map.categories.map((category) => category.id);
  const [visible, setVisible] = useState<string[]>(allCategoryIds);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categoryById = new Map(map.categories.map((category) => [category.id, category]));
  const shownPins = map.pins.filter((pin) => visible.includes(pin.categoryId));
  const selected: MapPin | undefined = shownPins.find((pin) => pin.id === selectedId);

  function toggleCategory(id: string): void {
    setVisible((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    );
  }

  return (
    <section className="mb-10">
      <SectionHeader title="Map" shapeIndex={shapeIndex} />

      <GlassCard className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter map pins by category">
          {map.categories.map((category) => {
            const tone = toneStyle(category.tone);
            const on = visible.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleCategory(category.id)}
                className={`flex items-center gap-2 rounded-pill border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  on
                    ? 'border-border-strong bg-surface-3 text-foreground'
                    : 'border-border-subtle text-foreground-muted hover:text-foreground'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: on ? tone.colorVar : 'transparent', outline: `1px solid ${tone.colorVar}` }}
                />
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-1">
          {/* Decorative backdrop: abstract zone blobs, drawn from the content's
              own zone list. Original artwork — deliberately not a reproduction
              of any in-game map. */}
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {map.zones.map((zone) => {
              const tone = toneStyle(zone.tone);
              const { x, y } = toViewBox(zone.x, zone.y);
              return (
                <g key={zone.id}>
                  <ellipse
                    cx={x}
                    cy={y}
                    rx={(zone.rx / 100) * VIEW_WIDTH}
                    ry={(zone.ry / 100) * VIEW_HEIGHT}
                    fill={tone.colorVar}
                    fillOpacity={0.1}
                    stroke={tone.colorVar}
                    strokeOpacity={0.3}
                    strokeWidth={0.3}
                  />
                  {/* Zone labels ride just inside the top edge of their blob
                      rather than its centre, so pins (which cluster around the
                      middle) never land on top of them. */}
                  <text
                    x={x}
                    y={y - (zone.ry / 100) * VIEW_HEIGHT + 2.6}
                    textAnchor="middle"
                    className="fill-foreground-muted"
                    style={{ fontSize: '2.6px', letterSpacing: '0.15px' }}
                  >
                    {zone.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Pins sit in their own percentage-positioned layer so they can be
              real focusable buttons rather than SVG shapes. */}
          <ul className="absolute inset-0 m-0 list-none p-0">
            {shownPins.map((pin) => {
              const category = categoryById.get(pin.categoryId);
              const tone = toneStyle(category?.tone ?? 'landmark');
              const isSelected = pin.id === selected?.id;
              return (
                <li
                  key={pin.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : pin.id)}
                    {...(isSelected ? { 'aria-current': true as const } : {})}
                    aria-label={`${pin.name} — ${category?.label ?? 'Pin'}`}
                    className={`flex items-center gap-1.5 rounded-pill border bg-surface-0/80 px-2 py-1 text-xs font-semibold backdrop-blur-sm transition-transform motion-safe:hover:-translate-y-0.5 ${
                      isSelected ? 'border-border-strong text-foreground' : 'border-border-subtle text-foreground-muted'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: tone.colorVar }}
                    />
                    <span className="whitespace-nowrap">{pin.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-3 text-sm text-foreground-muted">{map.caption}</p>

        <div aria-live="polite" className="mt-3">
          {selected ? (
            <div className="rounded-lg border border-border-subtle bg-surface-2 p-4">
              <h3 className="font-semibold text-foreground">{selected.name}</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                {selected.note ?? 'No notes on this one yet.'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">
              {shownPins.length === 0
                ? 'No pins shown — turn a category back on.'
                : 'Select a pin to read its note.'}
            </p>
          )}
        </div>
      </GlassCard>
    </section>
  );
}
