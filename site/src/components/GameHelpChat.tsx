import { CHAT_LIMITS, type ChatResponse, type ChatTurn, type HelpSource } from 'chat-server/contract';
import { motion } from 'motion/react';
import { useId, useRef, useState, type FormEvent } from 'react';

import { HelpDeskError, askHelpDesk } from '../help/client';
import { fadeRise } from '../motion/presets';
import { GlassCard } from './GlassCard';

/*
 * The help-desk chat: a thread of questions and answers over a small form.
 *
 * The component is deliberately dumb about what the bot may say — the server
 * owns the game-help-only guardrail and the "one guide + one video" source
 * contract, and this just renders whatever `ChatResponse` comes back: the
 * answer, its source links (badged by kind, and marked when the server had to
 * fall back to a search link), the searches the model ran, or a polite
 * decline for an off-topic question.
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
}

const KIND_LABEL: Record<HelpSource['kind'], string> = { article: 'Guide', video: 'Video' };

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
    <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0" aria-label="Sources">
      {sources.map((source) => (
        <li key={source.url} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
          <span className="rounded-pill border border-border-subtle px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {KIND_LABEL[source.kind]}
          </span>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-ps-blue-text underline-offset-2 hover:underline"
          >
            {source.title}
          </a>
          {source.fallback ? (
            <span className="text-xs text-foreground-muted">(no exact match found — this is a search)</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function AssistantMessage({ response }: { response: ChatResponse }) {
  if (response.kind === 'off-topic') {
    return (
      <>
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Game questions only</p>
        <p className="m-0 mt-1 text-foreground">{response.answer}</p>
      </>
    );
  }
  return (
    <>
      <p className="m-0 whitespace-pre-line text-foreground">{response.answer}</p>
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

export function GameHelpChat({ initialGame = '', suggestions = [], ask = askHelpDesk }: GameHelpChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [game, setGame] = useState(initialGame);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState(false);
  const nextId = useRef(1);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const gameFieldId = useId();
  const questionFieldId = useId();

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
      <ol role="log" aria-label="Conversation" aria-live="polite" className="m-0 flex list-none flex-col gap-3 p-0">
        {messages.length === 0 ? (
          <li className="text-foreground-muted">
            Ask how to do something in a game &mdash; a boss, a recipe, a trophy, a setting. Every answer comes with a
            written guide and a video to check it against.
          </li>
        ) : null}
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
                  : 'self-start rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 sm:max-w-[90%]'
            }
          >
            <span aria-hidden="true" className={`mr-2 ${message.role === 'user' ? 'text-shape-square' : 'text-shape-triangle'}`}>
              {message.role === 'user' ? '□' : '△'}
            </span>
            <span className="sr-only">{message.role === 'user' ? 'You: ' : 'Help desk: '}</span>
            {message.role === 'assistant' ? (
              <div className="mt-1">
                <AssistantMessage response={message.response} />
              </div>
            ) : (
              <span className="text-foreground">{message.text}</span>
            )}
          </motion.li>
        ))}
        {pending ? (
          <li role="status" className="text-sm text-foreground-muted">
            Looking that up&hellip;
          </li>
        ) : null}
      </ol>

      {messages.length === 0 && suggestions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Example questions">
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
      ) : null}

      <form onSubmit={submit} className="mt-5 flex flex-col gap-3" aria-busy={pending}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-1">
            <label htmlFor={gameFieldId} className="text-sm font-semibold text-foreground-muted">
              Game (optional)
            </label>
            <input
              id={gameFieldId}
              value={game}
              onChange={(event) => setGame(event.target.value)}
              maxLength={CHAT_LIMITS.gameMaxChars}
              autoComplete="off"
              placeholder="Grounded 2"
              className="rounded-md border border-border-subtle bg-surface-0 px-3 py-2 text-foreground placeholder:text-foreground-muted/70"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={questionFieldId} className="text-sm font-semibold text-foreground-muted">
              Your question
            </label>
            <textarea
              id={questionFieldId}
              ref={questionRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={CHAT_LIMITS.questionMaxChars}
              rows={2}
              required
              placeholder="How do I…"
              className="rounded-md border border-border-subtle bg-surface-0 px-3 py-2 text-foreground placeholder:text-foreground-muted/70"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-foreground-muted">
            Answers come from an AI and can be wrong &mdash; check the sources.
          </span>
          <button
            type="submit"
            disabled={pending || question.trim().length === 0}
            className="rounded-pill bg-ps-blue px-5 py-2 font-semibold text-foreground shadow-glow-sm transition-colors hover:bg-ps-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Asking…' : 'Ask'}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
