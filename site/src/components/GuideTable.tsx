import { useMemo, useState } from 'react';

import type { GuideTableContent } from '../companions/types';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';

/*
 * A sortable, filterable reference table — the equipment/materials module.
 *
 * Sorting is exposed the accessible way: each sortable header is a button inside
 * its <th>, and the <th> carries `aria-sort` so assistive tech announces the
 * current order. Filtering is a plain text box matched against every cell, so
 * "spear" or "smashing" both narrow the table without per-column controls.
 *
 * The table scrolls horizontally inside its own container rather than widening
 * the page on a phone.
 */

type SortDirection = 'asc' | 'desc';

function compare(a: string | number, b: string | number, numeric: boolean): number {
  if (numeric) return Number(a) - Number(b);
  return String(a).localeCompare(String(b));
}

export interface GuideTableProps {
  guide: GuideTableContent;
  /** Which PS shape accents the section header; wraps around △ ○ ✕ □. */
  shapeIndex?: number;
}

export function GuideTable({ guide, shapeIndex = 0 }: GuideTableProps) {
  const [query, setQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [direction, setDirection] = useState<SortDirection>('asc');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? guide.rows.filter((row) =>
          Object.values(row.cells).some((cell) => String(cell).toLowerCase().includes(needle)),
        )
      : guide.rows;

    if (!sortColumn) return filtered;
    const column = guide.columns.find((c) => c.id === sortColumn);
    if (!column) return filtered;

    return [...filtered].sort((a, b) => {
      const result = compare(a.cells[column.id] ?? '', b.cells[column.id] ?? '', column.numeric ?? false);
      return direction === 'asc' ? result : -result;
    });
  }, [guide.columns, guide.rows, query, sortColumn, direction]);

  function sortBy(columnId: string): void {
    if (sortColumn === columnId) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(columnId);
    setDirection('asc');
  }

  const filterId = `guide-filter-${guide.title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section className="mb-10">
      <SectionHeader title={guide.title} shapeIndex={shapeIndex} />
      <GlassCard className="p-4 sm:p-6">
        {guide.intro ? <p className="mb-4 text-sm text-foreground-muted">{guide.intro}</p> : null}

        <div className="mb-4">
          <label htmlFor={filterId} className="mb-1.5 block text-sm font-medium text-foreground-muted">
            Filter {guide.title.toLowerCase()}
          </label>
          <input
            id={filterId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type to narrow the table"
            className="w-full rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted sm:max-w-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            {/* The visible SectionHeader already names the table; the caption
                ties that name to the table itself for assistive tech. */}
            <caption className="sr-only">{guide.title}</caption>
            <thead>
              <tr className="border-b border-border-subtle">
                {guide.columns.map((column) => {
                  const active = sortColumn === column.id;
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`px-3 py-2 font-semibold text-foreground-muted ${column.numeric ? 'text-right' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => sortBy(column.id)}
                        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide transition-colors hover:text-foreground"
                      >
                        {column.label}
                        <span aria-hidden="true" className={active ? 'text-ps-blue-text' : 'opacity-40'}>
                          {active && direction === 'desc' ? '▼' : '▲'}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border-subtle last:border-b-0">
                  {guide.columns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-3 py-2.5 align-top text-foreground ${
                        column.numeric ? 'text-right tabular-nums' : ''
                      }`}
                    >
                      {row.cells[column.id] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-muted">Nothing matches &ldquo;{query}&rdquo;.</p>
        ) : null}
      </GlassCard>
    </section>
  );
}
