export type {
  GenreCache,
  GenreCacheEntry,
  OverridesFile,
  Suggestion,
  SuggestionsFile,
  SuggestionsMetadata,
} from './types.js';
export {
  buildGenreProfile,
  cleanTitleName,
  collectLibrary,
  sharedGenres,
  topGenresForPlayer,
} from './stats.js';
export type { GenreMinutes, MatchedGame, OwnedGame } from './stats.js';
export { fetchGenreSlugs, fetchSuggestionsForGenres, matchOwnedTitles } from './fetch.js';
export type { MatchResult, RawgDeps } from './fetch.js';
export { loadCache, missingKeys, saveCache } from './cache.js';
export { applyOverrides, loadOverrides } from './overrides.js';
export { writeSuggestionsAtomic } from './store.js';
export { syncSuggestions } from './sync.js';
export type { SyncSuggestionsOptions, SyncSuggestionsResult } from './sync.js';
