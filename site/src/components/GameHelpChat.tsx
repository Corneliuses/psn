import { CHAT_LIMITS, type ChatResponse, type ChatTurn, type HelpSource } from 'chat-server/contract';
import { motion } from 'motion/react';
import { useId, useRef, useState, type FormEvent } from 'react';

import { HelpDeskError, askHelpDesk } from '../help/client';
import type { SpeechReader } from '../help/speech';
import { fadeRise } from '../motion/presets';
import { GlassCard } from './GlassCard';
import { GuideIcon, PlayIcon, SparkIcon } from './HelpIcons';
import { ReadAloudButton } from './ReadAloudButton';

/*
 * The help-desk chat: a thread of questions and answers over a small form.
 *
 * The component is deliberately dumb about what the bot may say — the server
 * owns the game-help-only guardrail and the "one guide + one video" source
 * contract, and this just renders whatever `ChatResponse` comes back: the
 * answer, its source links (badged by kind, and marked when the server had to
 * fall back to a search link), the searches the model ran, or a polite
 * decline for an off-topic question. Each response carries one "Read aloud"
 * button that has the browser speak the answer text — and only the answer,
 * never the sources or searches.
 *
 * The form is the focus of the screen: it comes first while the thread is
 * empty (the page hero already says what the help desk is for, so there is
 * no second pitch here), with the starter questions beneath it as a nudge.
 * Once there are messages the thread sits above the form.
 *
 * The thread is a `role="log"` live region so screen readers hear new answers;
 * each message enters with the shared `fadeRise` preset, which Motion resolves
 * to its static end state under reduced motion.
 */

export interface HelpSuggestion {
  /** The game to pre-select when tapped. */
  game: string;
  question: string;
}

type MessageBody =
  | { role: 'user'; text: string }
  | { role: 'assistant'; response: ChatResponse }
  | { role: 'error'; text: string };

type Message = MessageBody & { id: number };

export interface GameHelpChatProps {
  /** Pre-fills the game field, e.g. when arriving from a companion app. */
  initialGame?: string;
  /** Starter questions shown while the thread is empty. */
  suggestions?: HelpSuggestion[];
  /** The API call; injectable for tests. */
  ask?: typeof askHelpDesk;
  /** The read-aloud engine; injectable for tests. Omit for the browser's own. */
  speech?: SpeechReader | null;
}

const KIND_LABEL: Record<HelpSource['kind'], string> = { article: 'Guide', video: 'Video' };

/**
 * The two fields are the point of the page, so they read as such: a solid
 * surface with a strong border, large text, and the PS-blue glow on focus
 * (on top of the global focus ring). All tokens — no one-off values.
 */
const FIELD_CLASS =
  'w-full rounded-lg border-2 border-border-strong bg-surface-0 px-4 py-3 text-lg text-foreground shadow-panel transition-[border-color,box-shadow] placeholder:text-foreground-muted/70 hover:border-ps-blue/60 focus:border-ps-blue focus:shadow-glow';

/** The source glyphs: a page for a guide, a play tile for a video (the label carries the meaning). */
function SourceIcon({ kind }: { kind: HelpSource['kind'] }) {
  return kind === 'video' ? (
    <PlayIcon className="h-5 w-5 shrink-0 text-shape-circle" />
  ) : (
    <GuideIcon className="h-5 w-5 shrink-0 text-ps-blue-text" />
  );
}

/** The "AI" badge an answer carries. */
function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-ps-blue/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ps-blue-text">
      <SparkIcon className="h-3.5 w-3.5" />
      AI
    </span>
  );
}

/** The transcript as the server wants it: plain text per turn, answers only. */
function toHistory(messages: Message[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (const message of messages) {
    if (message.role === 'user') turns.push({ role: 'user', text: message.text });
    else if (message.role === 'assistant') turns.push({ role: 'assistant', text: message.response.answer });
  }
  return turns.slice(-CHAT_LIMITS.historyMaxTurns);
}

function SourceList({ sources }: { sources: HelpSource[] }) {
  return (
    <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 sm:flex-row sm:flex-wrap" aria-label="Sources">
      {sources.map((source) => (
        <li
          key={source.url}
          className="flex min-w-0 items-center gap-2.5 rounded-md border border-border-subtle bg-surface-2 px-3 py-2 text-sm sm:max-w-[48%]"
        >
          <SourceIcon kind={source.kind} />
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              {KIND_LABEL[source.kind]}
            </span>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="break-words font-semibold text-foreground underline-offset-2 hover:text-ps-blue-text hover:underline"
            >
              {source.title}
            </a>
            {source.fallback ? (
              <span className="text-xs text-foreground-muted">(no exact match found — this is a search)</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AssistantMessage({ response, speech }: { response: ChatResponse; speech: SpeechReader | null | undefined }) {
  const readAloud = <ReadAloudButton text={response.answer} className="mt-3" {...(speech !== undefined ? { speech } : {})} />;
  if (response.kind === 'off-topic') {
    return (
      <>
        <p className="m-0 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          <AiBadge />
          Game questions only
        </p>
        <p className="m-0 mt-2 text-foreground">{response.answer}</p>
        {readAloud}
      </>
    );
  }
  return (
    <>
      <p className="m-0">
        <AiBadge />
      </p>
      <p className="m-0 mt-2 whitespace-pre-line text-lg leading-snug text-foreground">{response.answer}</p>
      {readAloud}
      <SourceList sources={response.sources} />
      {response.searches.length > 0 ? (
        <p className="m-0 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground-muted">
          <span>Searched for</span>
          {response.searches.map((query) => (
            <a
              key={query}
              href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-pill border border-border-subtle px-2 py-0.5 hover:text-foreground"
            >
              {query}
            </a>
          ))}
        </p>
      ) : null}
    </>
  );
}

export function GameHelpChat({ initialGame = '', suggestions = [], ask = askHelpDesk, speech }: GameHelpChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [game, setGame] = useState(initialGame);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState(false);
  const nextId = useRef(1);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const gameFieldId = useId();
  const questionFieldId = useId();
  const hasThread = messages.length > 0 || pending;

  const push = (message: MessageBody): void => {
    const id = nextId.current++;
    setMessages((current) => [...current, { ...message, id }]);
  };

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    const trimmedGame = game.trim();
    if (!trimmedQuestion || pending) return;

    const history = toHistory(messages);
    push({ role: 'user', text: trimmedQuestion });
    setQuestion('');
    setPending(true);
    try {
      const response = await ask({
        question: trimmedQuestion,
        ...(trimmedGame ? { game: trimmedGame } : {}),
        ...(history.length ? { history } : {}),
      });
      push({ role: 'assistant', response });
    } catch (error) {
      push({ role: 'error', text: error instanceof HelpDeskError ? error.message : 'Something went wrong answering that.' });
    } finally {
      setPending(false);
      questionRef.current?.focus();
    }
  }

  function applySuggestion(suggestion: HelpSuggestion): void {
    setGame(suggestion.game);
    setQuestion(suggestion.question);
    questionRef.current?.focus();
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <ol
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        className={`m-0 flex list-none flex-col gap-3 p-0 ${hasThread ? 'mb-5' : ''}`}
      >
        {messages.map((message) => (
          <motion.li
            key={message.id}
            variants={fadeRise}
            initial="hidden"
            animate="visible"
            {...(message.role === 'error' ? { role: 'alert' } : {})}
            className={
              message.role === 'user'
                ? 'self-end rounded-lg border border-border-strong bg-surface-3 px-4 py-2.5 sm:max-w-[80%]'
                : message.role === 'error'
                  ? 'self-start rounded-lg border border-shape-circle/60 bg-surface-1 px-4 py-2.5 text-foreground'
                  : 'min-w-0 max-w-full self-start rounded-lg border border-ps-blue/40 bg-ps-blue/10 px-4 py-3 shadow-glow-sm sm:max-w-[90%]'
            }
          >
            {message.role !== 'assistant' ? (
              <span aria-hidden="true" className={`mr-2 ${message.role === 'user' ? 'text-shape-square' : 'text-shape-circle'}`}>
                {message.role === 'user' ? '□' : '○'}
              </span>
            ) : null}
            <span className="sr-only">{message.role === 'user' ? 'You: ' : 'Help desk: '}</span>
            {message.role === 'assistant' ? (
              <AssistantMessage response={message.response} speech={speech} />
            ) : (
              <span className="text-foreground">{message.text}</span>
            )}
          </motion.li>
        ))}
        {pending ? (
          <li role="status" className="flex items-center gap-2 text-sm font-semibold text-ps-blue-text">
            <SparkIcon className="h-4 w-4 motion-safe:animate-flicker" />
            Thinking&hellip;
          </li>
        ) : null}
      </ol>

      <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={pending}>
        <div className="flex flex-col gap-2">
          <label htmlFor={questionFieldId} className="text-base font-bold text-foreground">
            Your question
          </label>
          <textarea
            id={questionFieldId}
            ref={questionRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={CHAT_LIMITS.questionMaxChars}
            rows={3}
            required
            placeholder="How do I…"
            className={FIELD_CLASS}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="flex flex-col gap-2">
            <label htmlFor={gameFieldId} className="text-base font-bold text-foreground">
              Game <span className="font-normal text-foreground-muted">(optional)</span>
            </label>
            <input
              id={gameFieldId}
              value={game}
              onChange={(event) => setGame(event.target.value)}
              maxLength={CHAT_LIMITS.gameMaxChars}
              autoComplete="off"
              placeholder="Grounded 2"
              className={FIELD_CLASS}
            />
          </div>
          <button
            type="submit"
            disabled={pending || question.trim().length === 0}
            className="rounded-pill bg-ps-blue-fill px-7 py-3 text-lg font-bold text-foreground shadow-glow transition-colors hover:bg-ps-blue-fill-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {pending ? 'Asking…' : 'Ask'}
          </button>
        </div>
        <p className="m-0 text-xs text-foreground-muted">AI can be wrong &mdash; check the sources.</p>
      </form>

      {!hasThread && suggestions.length > 0 ? (
        <div className="mt-5 border-t border-border-subtle pt-4" role="group" aria-label="Example questions">
          <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Or try one of these</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={`${suggestion.game}:${suggestion.question}`}
                type="button"
                onClick={() => applySuggestion(suggestion)}
                className="rounded-pill border border-border-subtle px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
              >
                {suggestion.question}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
