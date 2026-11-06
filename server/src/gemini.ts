/*
 * A minimal Gemini client over the public REST API (`generateContent`), using
 * the built-in `fetch`. No SDK: the surface we need is one endpoint, and an
 * injectable `fetch` keeps the tests fixture-based and offline.
 *
 * Google Search grounding is on, so the reply carries the pages the model
 * actually read (`groundingChunks`) and the searches it ran
 * (`webSearchQueries`) — the raw material for the answer's source links.
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiGroundingChunk {
  uri: string;
  title?: string;
}

/** What the rest of the server needs from a `generateContent` response. */
export interface GeminiReply {
  /** The visible text parts, concatenated (thinking parts are dropped). */
  text: string;
  /** True when the prompt or the candidate was blocked by safety filters. */
  blocked: boolean;
  groundingChunks: GeminiGroundingChunk[];
  webSearchQueries: string[];
}

export interface GeminiClientOptions {
  apiKey: string;
  model?: string;
  /** Override for tests; defaults to the global `fetch`. */
  fetch?: typeof fetch;
  /** Per-request timeout in milliseconds. */
  timeoutMs?: number;
  apiBase?: string;
}

/** Thrown when Gemini is unreachable or returns an error; `app.ts` maps it to HTTP 502. */
export class GeminiError extends Error {
  override readonly name = 'GeminiError';
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

interface GenerateContentResponse {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
    groundingMetadata?: {
      groundingChunks?: { web?: { uri?: string; title?: string } }[];
      webSearchQueries?: string[];
    };
  }[];
  promptFeedback?: { blockReason?: string };
}

export interface GeminiClient {
  readonly model: string;
  generate(systemInstruction: string, contents: GeminiContent[]): Promise<GeminiReply>;
}

export function createGeminiClient(options: GeminiClientOptions): GeminiClient {
  const model = options.model ?? DEFAULT_GEMINI_MODEL;
  const fetchImpl = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const url = `${options.apiBase ?? GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`;

  return {
    model,
    async generate(systemInstruction, contents) {
      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': options.apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            tools: [{ googleSearch: {} }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        throw new GeminiError(`Gemini request failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (!response.ok) {
        // Never echo the body: Google's error payloads can quote the request URL.
        throw new GeminiError(`Gemini responded ${response.status}`, response.status);
      }

      const body = (await response.json()) as GenerateContentResponse;
      const candidate = body.candidates?.[0];
      const blocked = body.promptFeedback?.blockReason !== undefined || candidate?.finishReason === 'SAFETY';
      const text = (candidate?.content?.parts ?? [])
        .filter((part) => !part.thought && typeof part.text === 'string')
        .map((part) => part.text)
        .join('');
      const grounding = candidate?.groundingMetadata;

      return {
        text,
        blocked,
        groundingChunks: (grounding?.groundingChunks ?? []).flatMap((chunk) => {
          if (!chunk.web?.uri) return [];
          return [chunk.web.title ? { uri: chunk.web.uri, title: chunk.web.title } : { uri: chunk.web.uri }];
        }),
        webSearchQueries: grounding?.webSearchQueries ?? [],
      };
    },
  };
}
