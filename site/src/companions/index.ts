import { grounded2 } from './grounded-2';
import type { Companion } from './types';

/*
 * The companion registry. Adding a game is one content file plus one line here —
 * the grid, the routes and the page all derive from this array, so nothing else
 * changes. Order here is the order tiles appear.
 */
export const companions: Companion[] = [grounded2];

export function companionBySlug(slug: string | undefined): Companion | undefined {
  return companions.find((companion) => companion.slug === slug);
}

export type { Companion } from './types';
