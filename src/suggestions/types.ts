/** One unowned game suggested for a genre, sourced from RAWG. */
export interface Suggestion {
  name: string;
  rawgId: number;
  /** RAWG Metacritic score, 0–100, or null if unrated. */
  rating: number | null;
  /** ISO 8601 date, or null if unknown. */
  released: string | null;
}

export interface SuggestionsMetadata {
  /** ISO 8601 datetime the file was generated. */
  generated_at: string;
  rawg_base_url: string;
  attribution: string;
  build: string;
}

/** Shape of the committed `data/suggestions.json`. */
export interface SuggestionsFile {
  by_genre: Record<string, Suggestion[]>;
  /** Top shared genres, ranked by combined playtime — the order the UI groups by. */
  shared_genres: string[];
  metadata: SuggestionsMetadata;
}

/** One owned title's RAWG match, cached by nameKey() so repeat syncs skip re-matching. */
export interface GenreCacheEntry {
  rawgId: number | null;
  matchedName: string | null;
  genres: string[];
  /** ISO 8601 datetime the match was made. */
  checkedAt: string;
}

/** `data/suggestions-cache.json` shape: nameKey() → cached match. */
export type GenreCache = Record<string, GenreCacheEntry>;

/**
 * `data/suggestions-overrides.json` shape (gitignored, local-only): manual
 * corrections applied after fetch, before the final write.
 */
export interface OverridesFile {
  /** RAWG IDs or lowercase title names to exclude from every genre. */
  hide?: (number | string)[];
  /** Extra suggestions to append per genre (e.g. VR games RAWG tags poorly). */
  add?: Record<string, Suggestion[]>;
}
