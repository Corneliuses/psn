/*
 * The wire contract between the site's help desk UI and the chat server.
 *
 * This file is the only thing `site/` imports from the server package: the
 * types, and the `CHAT_LIMITS` the UI mirrors. It must stay free of imports and
 * of anything Node-specific so the browser bundle can include it untouched.
 */

/** One earlier exchange, sent back so the model can answer follow-ups. */
export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** `POST /api/chat` request body. */
export interface ChatRequest {
  /** The player's question, e.g. "How do I beat the Mantis?". */
  question: string;
  /** The game the question is about, when the UI knows it (e.g. from a companion app). */
  game?: string;
  /** Most recent turns first-to-last; the server keeps only the tail it needs. */
  history?: ChatTurn[];
}

/** A link backing an answer. Every answer carries at least one of each kind. */
export interface HelpSource {
  title: string;
  url: string;
  /** `article` is a written guide or wiki page; `video` is a YouTube link. */
  kind: 'article' | 'video';
  /**
   * True when the server could not find a specific page or video and filled the
   * slot with a search link for the question instead. The UI says so.
   */
  fallback?: boolean;
}

/** A successful game-help answer. */
export interface ChatAnswer {
  kind: 'answer';
  /** A succinct plain-text answer (short paragraph or a few numbered steps). */
  answer: string;
  /** At least one `article` and at least one `video`, articles first. */
  sources: HelpSource[];
  /** The web searches the model ran to ground the answer, shown as suggestions. */
  searches: string[];
}

/** The question was not about playing a game, so the help desk declined. */
export interface ChatDeclined {
  kind: 'off-topic';
  answer: string;
}

export type ChatResponse = ChatAnswer | ChatDeclined;

/** Every non-2xx response carries this body. */
export interface ChatError {
  error: string;
}

/** Input limits enforced by the server and mirrored by the UI. */
export const CHAT_LIMITS = {
  questionMaxChars: 500,
  gameMaxChars: 100,
  historyMaxTurns: 6,
  historyTurnMaxChars: 2000,
} as const;
