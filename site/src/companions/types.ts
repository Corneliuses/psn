/*
 * The companion-app content model.
 *
 * A companion is a single hand-written content file per game (see
 * `grounded-2.ts`) describing what we want at hand while we actually play it.
 * Every module below is optional: a title declares only the ones it has content
 * for, and `CompanionPage` renders exactly those, in a fixed order. That way a
 * new game can ship with just a links list and grow over time without any
 * component or route changes.
 *
 * Content is data, never markup — no component reads raw HTML from here.
 */

/** A colour role for map pins and quick-reference chips. Maps to a shape token. */
export type CompanionTone = 'resource' | 'creature' | 'landmark' | 'base';

export interface CompanionLink {
  label: string;
  href: string;
  /** One line on why this link is worth opening. */
  note?: string;
}

export interface CompanionVideo {
  title: string;
  /** The YouTube video id (the `v=` parameter), not a full URL. */
  youtubeId: string;
  note?: string;
}

export interface QuickReferenceItem {
  term: string;
  detail: string;
}

export interface QuickReferenceGroup {
  title: string;
  items: QuickReferenceItem[];
}

export interface MapZone {
  id: string;
  label: string;
  /** Centre as a percentage of the map box, 0–100. */
  x: number;
  y: number;
  /** Radii as a percentage of the map box. */
  rx: number;
  ry: number;
  tone: CompanionTone;
}

export interface MapPin {
  id: string;
  name: string;
  /** Must match a `MapCategory.id` on the same map. */
  categoryId: string;
  /** Position as a percentage of the map box, 0–100. */
  x: number;
  y: number;
  note?: string;
}

export interface MapCategory {
  id: string;
  label: string;
  tone: CompanionTone;
}

export interface CompanionMapContent {
  /** Sets expectations about what this drawing is — always shown under the map. */
  caption: string;
  zones: MapZone[];
  categories: MapCategory[];
  pins: MapPin[];
}

export interface GuideColumn {
  /** Key into a row's `cells`. */
  id: string;
  label: string;
  /** Right-aligns and sorts numerically. Defaults to text. */
  numeric?: boolean;
}

export interface GuideRow {
  id: string;
  cells: Record<string, string | number>;
}

export interface GuideTableContent {
  title: string;
  /** One line under the heading explaining what the table covers. */
  intro?: string;
  columns: GuideColumn[];
  rows: GuideRow[];
}

export interface CompanionNote {
  title: string;
  body: string;
}

export interface Companion {
  /** URL segment, e.g. `grounded-2`. */
  slug: string;
  /** Display name for the tile and page heading. */
  name: string;
  /** Short line on the tile. */
  tagline: string;
  /** A sentence or two at the top of the page. */
  blurb: string;
  /**
   * Every name PSN spells this game by, across played titles and trophy lists.
   * Used to look the game up in each player's snapshot for the together stats —
   * see `titleStats` in the data layer.
   */
  psnTitleNames: string[];
  quickReference?: QuickReferenceGroup[];
  map?: CompanionMapContent;
  guides?: GuideTableContent[];
  links?: CompanionLink[];
  videos?: CompanionVideo[];
  notes?: CompanionNote[];
}
