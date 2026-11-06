import { describe, expect, it } from 'vitest';

import { CHAT_LIMITS } from '../src/contract';
import type { GeminiReply } from '../src/gemini';
import {
  BadRequestError,
  OFF_TOPIC_FALLBACK,
  SYSTEM_INSTRUCTION,
  buildContents,
  finaliseSources,
  isYouTubeUrl,
  parseChatRequest,
  parseModelAnswer,
  toChatResponse,
} from '../src/help';

const reply = (overrides: Partial<GeminiReply>): GeminiReply => ({
  text: '',
  blocked: false,
  groundingChunks: [],
  webSearchQueries: [],
  ...overrides,
});

const ARTICLE = 'https://grounded.fandom.com/wiki/Mantis';
const VIDEO = 'https://www.youtube.com/watch?v=abc123';

describe('parseChatRequest', () => {
  it('trims and keeps only the fields it knows', () => {
    expect(parseChatRequest({ question: '  How do I beat the Mantis?  ', game: ' Grounded 2 ', extra: 1 })).toEqual({
      question: 'How do I beat the Mantis?',
      game: 'Grounded 2',
    });
  });

  it('drops an empty game and an empty history', () => {
    expect(parseChatRequest({ question: 'q', game: '   ', history: [] })).toEqual({ question: 'q' });
  });

  it('keeps only the newest history turns, each capped in length', () => {
    const history = Array.from({ length: CHAT_LIMITS.historyMaxTurns + 2 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      text: `turn ${i} ${'x'.repeat(CHAT_LIMITS.historyTurnMaxChars + 10)}`,
    }));
    const parsed = parseChatRequest({ question: 'q', history });
    expect(parsed.history).toHaveLength(CHAT_LIMITS.historyMaxTurns);
    expect(parsed.history?.[0]?.text.startsWith('turn 2 ')).toBe(true);
    for (const turn of parsed.history ?? []) expect(turn.text.length).toBe(CHAT_LIMITS.historyTurnMaxChars);
  });

  it.each([
    [null, 'Expected a JSON object'],
    [{}, '"question" must be a non-empty string'],
    [{ question: '   ' }, '"question" must be a non-empty string'],
    [{ question: 'x'.repeat(CHAT_LIMITS.questionMaxChars + 1) }, `at most ${CHAT_LIMITS.questionMaxChars}`],
    [{ question: 'q', game: 42 }, '"game" must be a string'],
    [{ question: 'q', game: 'g'.repeat(CHAT_LIMITS.gameMaxChars + 1) }, `at most ${CHAT_LIMITS.gameMaxChars}`],
    [{ question: 'q', history: 'nope' }, '"history" must be a list'],
    [{ question: 'q', history: [{ role: 'system', text: 'x' }] }, '"history" must be a list'],
  ])('rejects %j', (body, message) => {
    expect(() => parseChatRequest(body)).toThrow(BadRequestError);
    expect(() => parseChatRequest(body)).toThrow(message);
  });
});

describe('buildContents', () => {
  it('maps history to Gemini roles and prefixes the game onto the question', () => {
    expect(
      buildContents({
        question: 'And the Wolf Spider?',
        game: 'Grounded 2',
        history: [
          { role: 'user', text: 'How do I beat the Mantis?' },
          { role: 'assistant', text: 'Dodge its lunge.' },
        ],
      }),
    ).toEqual([
      { role: 'user', parts: [{ text: 'How do I beat the Mantis?' }] },
      { role: 'model', parts: [{ text: 'Dodge its lunge.' }] },
      { role: 'user', parts: [{ text: 'Game: Grounded 2\nQuestion: And the Wolf Spider?' }] },
    ]);
  });

  it('sends a bare question when no game is known', () => {
    expect(buildContents({ question: 'How do I parry?' })).toEqual([{ role: 'user', parts: [{ text: 'How do I parry?' }] }]);
  });
});

describe('SYSTEM_INSTRUCTION', () => {
  it('states the scope, the brevity cap, and both source kinds', () => {
    expect(SYSTEM_INSTRUCTION).toMatch(/only questions about how to do something in a video game/);
    expect(SYSTEM_INSTRUCTION).toMatch(/at most 120 words/);
    expect(SYSTEM_INSTRUCTION).toMatch(/"kind": "article"/);
    expect(SYSTEM_INSTRUCTION).toMatch(/"kind": "video"/);
    expect(SYSTEM_INSTRUCTION).toMatch(/Never invent a URL/);
  });
});

describe('isYouTubeUrl', () => {
  it.each([VIDEO, 'https://youtu.be/abc123', 'https://m.youtube.com/watch?v=x'])('accepts %s', (url) => {
    expect(isYouTubeUrl(url)).toBe(true);
  });
  it.each([ARTICLE, 'https://notyoutube.com/watch', 'not a url'])('rejects %s', (url) => {
    expect(isYouTubeUrl(url)).toBe(false);
  });
});

describe('parseModelAnswer', () => {
  it('parses the JSON contract and classifies sources by URL, not by label', () => {
    const parsed = parseModelAnswer(
      JSON.stringify({
        onTopic: true,
        answer: ' Dodge the lunge, then hit its legs. ',
        sources: [
          { title: 'Mantis wiki', url: ARTICLE, kind: 'video' },
          { title: 'Mantis fight', url: VIDEO, kind: 'article' },
          { title: 'bogus', url: 'javascript:alert(1)', kind: 'article' },
          { title: 'no url' },
        ],
      }),
    );
    expect(parsed).toEqual({
      onTopic: true,
      answer: 'Dodge the lunge, then hit its legs.',
      sources: [
        { title: 'Mantis wiki', url: ARTICLE, kind: 'article' },
        { title: 'Mantis fight', url: VIDEO, kind: 'video' },
      ],
    });
  });

  it('tolerates markdown fences and chatter around the JSON', () => {
    const parsed = parseModelAnswer('Sure!\n```json\n{"onTopic": false, "answer": "Game questions only.", "sources": []}\n```');
    expect(parsed).toEqual({ onTopic: false, answer: 'Game questions only.', sources: [] });
  });

  it('treats a non-JSON reply as a plain on-topic answer and salvages its URLs', () => {
    const parsed = parseModelAnswer(`Block high then counter. See ${ARTICLE} and ${VIDEO}.`);
    expect(parsed.onTopic).toBe(true);
    expect(parsed.answer).toBe('Block high then counter. See and .');
    expect(parsed.sources.map((s) => [s.url, s.kind])).toEqual([
      [ARTICLE, 'article'],
      [VIDEO, 'video'],
    ]);
  });

  it('falls back to the URL as the title when the model gives none', () => {
    const parsed = parseModelAnswer(JSON.stringify({ answer: 'x', sources: [{ url: ARTICLE }] }));
    expect(parsed.sources[0]?.title).toBe(ARTICLE);
  });
});

describe('finaliseSources', () => {
  const request = { question: 'How do I beat the Mantis?', game: 'Grounded 2' };

  it('puts articles before videos and dedupes across model and grounding sources', () => {
    const sources = finaliseSources(
      [{ title: 'v', url: VIDEO, kind: 'video' }, { title: 'a', url: ARTICLE, kind: 'article' }],
      [{ title: 'dup', url: `${ARTICLE}/`, kind: 'article' }, { title: 'g', url: 'https://ign.com/mantis', kind: 'article' }],
      request,
    );
    expect(sources.map((s) => s.url)).toEqual([ARTICLE, 'https://ign.com/mantis', VIDEO]);
    expect(sources.every((s) => !s.fallback)).toBe(true);
  });

  it('caps each kind', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ title: `${i}`, url: `https://a.example/${i}`, kind: 'article' as const }));
    const sources = finaliseSources(many, [], request, 2);
    expect(sources.filter((s) => s.kind === 'article')).toHaveLength(2);
  });

  it('always yields at least one article and one video, flagging search fallbacks', () => {
    const sources = finaliseSources([], [], request);
    expect(sources).toEqual([
      {
        title: 'Search the web for "Grounded 2 How do I beat the Mantis?"',
        url: `https://www.google.com/search?q=${encodeURIComponent('Grounded 2 How do I beat the Mantis?')}`,
        kind: 'article',
        fallback: true,
      },
      {
        title: 'Search YouTube for "Grounded 2 How do I beat the Mantis?"',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent('Grounded 2 How do I beat the Mantis?')}`,
        kind: 'video',
        fallback: true,
      },
    ]);
  });

  it('fills only the missing kind', () => {
    const sources = finaliseSources([{ title: 'a', url: ARTICLE, kind: 'article' }], [], { question: 'q' });
    expect(sources[0]).toEqual({ title: 'a', url: ARTICLE, kind: 'article' });
    expect(sources[1]).toMatchObject({ kind: 'video', fallback: true, url: expect.stringContaining('youtube.com/results') });
  });
});

describe('toChatResponse', () => {
  const request = { question: 'How do I beat the Mantis?', game: 'Grounded 2' };

  it('builds an answer with the contract-complete source list and the searches run', () => {
    const response = toChatResponse(
      reply({
        text: JSON.stringify({ onTopic: true, answer: 'Dodge, then strike.', sources: [{ title: 'Wiki', url: ARTICLE }] }),
        groundingChunks: [{ uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/x', title: 'Mantis boss fight - YouTube' }],
        webSearchQueries: ['grounded 2 mantis boss'],
      }),
      request,
    );
    expect(response).toEqual({
      kind: 'answer',
      answer: 'Dodge, then strike.',
      sources: [
        { title: 'Wiki', url: ARTICLE, kind: 'article' },
        { title: 'Mantis boss fight - YouTube', url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/x', kind: 'video' },
      ],
      searches: ['grounded 2 mantis boss'],
    });
  });

  it('declines an off-topic message with the model\'s redirect line and no sources', () => {
    const response = toChatResponse(
      reply({ text: JSON.stringify({ onTopic: false, answer: 'I only do game questions!', sources: [] }) }),
      { question: 'Write my essay' },
    );
    expect(response).toEqual({ kind: 'off-topic', answer: 'I only do game questions!' });
  });

  it('declines with the stock line when the model was blocked or gave no text', () => {
    expect(toChatResponse(reply({ blocked: true, text: 'ignored' }), request)).toEqual({ kind: 'off-topic', answer: OFF_TOPIC_FALLBACK });
    expect(toChatResponse(reply({ text: '{"onTopic": false, "answer": ""}' }), request)).toEqual({
      kind: 'off-topic',
      answer: OFF_TOPIC_FALLBACK,
    });
  });
});
