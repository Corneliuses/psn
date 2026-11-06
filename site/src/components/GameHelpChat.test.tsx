import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChatResponse } from 'chat-server/contract';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';

import { GameHelpChat, type GameHelpChatProps } from './GameHelpChat';
import { HELP_OFFLINE_MESSAGE, HelpDeskError } from '../help/client';

const answer: ChatResponse = {
  kind: 'answer',
  answer: 'Dodge the lunge, then hit its legs.',
  sources: [
    { title: 'Mantis — Grounded Wiki', url: 'https://grounded.fandom.com/wiki/Mantis', kind: 'article' },
    { title: 'Search YouTube for "Mantis"', url: 'https://www.youtube.com/results?search_query=Mantis', kind: 'video', fallback: true },
  ],
  searches: ['grounded 2 mantis'],
};

function renderChat(props: GameHelpChatProps = {}) {
  const ask = props.ask ?? vi.fn(async () => answer);
  const utils = render(
    <MotionConfig reducedMotion="always">
      <GameHelpChat {...props} ask={ask} />
    </MotionConfig>,
  );
  return { ...utils, ask, user: userEvent.setup() };
}

describe('GameHelpChat', () => {
  it('renders the labelled form, the empty thread and the starter questions', () => {
    renderChat({ suggestions: [{ game: 'Grounded 2', question: 'How do I get started in Grounded 2?' }] });

    expect(screen.getByRole('log', { name: 'Conversation' })).toBeInTheDocument();
    expect(screen.getByLabelText('Game (optional)')).toHaveValue('');
    expect(screen.getByLabelText('Your question')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
    expect(
      within(screen.getByRole('group', { name: 'Example questions' })).getByRole('button', {
        name: 'How do I get started in Grounded 2?',
      }),
    ).toBeInTheDocument();
  });

  it('pre-fills the game and fills the form from a starter question', async () => {
    const { user } = renderChat({
      initialGame: 'LEGO Batman',
      suggestions: [{ game: 'Grounded 2', question: 'How do I get started in Grounded 2?' }],
    });
    expect(screen.getByLabelText('Game (optional)')).toHaveValue('LEGO Batman');

    await user.click(screen.getByRole('button', { name: 'How do I get started in Grounded 2?' }));
    expect(screen.getByLabelText('Game (optional)')).toHaveValue('Grounded 2');
    expect(screen.getByLabelText('Your question')).toHaveValue('How do I get started in Grounded 2?');
    expect(screen.getByLabelText('Your question')).toHaveFocus();
  });

  it('sends the question with the game, then renders the answer with badged sources and searches', async () => {
    const { user, ask } = renderChat({ initialGame: 'Grounded 2' });

    await user.type(screen.getByLabelText('Your question'), 'How do I beat the Mantis?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(ask).toHaveBeenCalledWith({ question: 'How do I beat the Mantis?', game: 'Grounded 2' });

    const log = screen.getByRole('log', { name: 'Conversation' });
    expect(within(log).getByText('How do I beat the Mantis?')).toBeInTheDocument();
    expect(await within(log).findByText('Dodge the lunge, then hit its legs.')).toBeInTheDocument();

    const sources = within(log).getByRole('list', { name: 'Sources' });
    const items = within(sources).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText('Guide')).toBeInTheDocument();
    expect(within(items[0]!).getByRole('link', { name: 'Mantis — Grounded Wiki' })).toHaveAttribute(
      'href',
      'https://grounded.fandom.com/wiki/Mantis',
    );
    expect(within(items[1]!).getByText('Video')).toBeInTheDocument();
    expect(within(items[1]!).getByRole('link', { name: 'Search YouTube for "Mantis"' })).toHaveAttribute(
      'href',
      'https://www.youtube.com/results?search_query=Mantis',
    );
    // The fallback slot says so.
    expect(within(items[1]!).getByText(/this is a search/)).toBeInTheDocument();
    expect(within(items[0]!).queryByText(/this is a search/)).toBeNull();

    expect(within(log).getByRole('link', { name: 'grounded 2 mantis' })).toHaveAttribute(
      'href',
      'https://www.google.com/search?q=grounded%202%20mantis',
    );

    // The question field clears and keeps focus for a follow-up; the starters are gone.
    expect(screen.getByLabelText('Your question')).toHaveValue('');
    expect(screen.queryByRole('group', { name: 'Example questions' })).toBeNull();
  });

  it('offers one button per answer that reads the answer text only, never the sources', async () => {
    const speech = { speak: vi.fn(), stop: vi.fn() };
    const { user } = renderChat({ speech });

    await user.type(screen.getByLabelText('Your question'), 'How do I beat the Mantis?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));
    await screen.findByText('Dodge the lunge, then hit its legs.');

    const log = screen.getByRole('log', { name: 'Conversation' });
    const buttons = within(log).getAllByRole('button', { name: 'Read aloud' });
    expect(buttons).toHaveLength(1);

    await user.click(buttons[0]!);
    expect(speech.speak).toHaveBeenCalledTimes(1);
    const [spoken] = speech.speak.mock.calls[0]!;
    expect(spoken).toBe('Dodge the lunge, then hit its legs.');
    expect(spoken).not.toMatch(/Mantis — Grounded Wiki|youtube|grounded 2 mantis/);
    expect(within(log).getByRole('button', { name: 'Stop reading' })).toBeInTheDocument();
  });

  it('offers the read-aloud button on an off-topic decline too, and hides it without speech support', async () => {
    const decline: ChatResponse = { kind: 'off-topic', answer: 'I only help with games.' };
    const { user, unmount } = renderChat({ ask: vi.fn(async () => decline), speech: { speak: vi.fn(), stop: vi.fn() } });
    await user.type(screen.getByLabelText('Your question'), 'Do my homework');
    await user.click(screen.getByRole('button', { name: 'Ask' }));
    await screen.findByText('I only help with games.');
    expect(screen.getByRole('button', { name: 'Read aloud' })).toBeInTheDocument();
    unmount();

    // No engine (as in jsdom by default): no button, nothing else changes.
    const silent = renderChat({ ask: vi.fn(async () => decline) });
    await silent.user.type(screen.getByLabelText('Your question'), 'Do my homework');
    await silent.user.click(screen.getByRole('button', { name: 'Ask' }));
    await screen.findByText('I only help with games.');
    expect(screen.queryByRole('button', { name: 'Read aloud' })).toBeNull();
  });

  it('sends the earlier turns as history on a follow-up', async () => {
    const { user, ask } = renderChat();

    await user.type(screen.getByLabelText('Your question'), 'First?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));
    await screen.findByText('Dodge the lunge, then hit its legs.');

    await user.type(screen.getByLabelText('Your question'), 'Second?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(ask).toHaveBeenLastCalledWith({
      question: 'Second?',
      history: [
        { role: 'user', text: 'First?' },
        { role: 'assistant', text: 'Dodge the lunge, then hit its legs.' },
      ],
    });
  });

  it('renders an off-topic decline without sources', async () => {
    const { user } = renderChat({
      ask: vi.fn(async () => ({ kind: 'off-topic', answer: 'I only help with games.' }) as ChatResponse),
    });

    await user.type(screen.getByLabelText('Your question'), 'Do my homework');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByText('I only help with games.')).toBeInTheDocument();
    expect(screen.getByText('Game questions only')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Sources' })).toBeNull();
  });

  it('shows a help-desk error as an alert and lets the player try again', async () => {
    const { user } = renderChat({
      ask: vi.fn(async () => {
        throw new HelpDeskError(HELP_OFFLINE_MESSAGE);
      }),
    });

    await user.type(screen.getByLabelText('Your question'), 'How do I parry?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(HELP_OFFLINE_MESSAGE);
    expect(screen.getByRole('button', { name: 'Ask' })).toBeInTheDocument();
    expect(screen.getByLabelText('Your question')).not.toBeDisabled();
  });

  it('shows a busy status while waiting and disables the button', async () => {
    let resolve: (value: ChatResponse) => void = () => {};
    const { user } = renderChat({ ask: vi.fn(() => new Promise<ChatResponse>((r) => (resolve = r))) });

    await user.type(screen.getByLabelText('Your question'), 'How do I parry?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(screen.getByRole('status')).toHaveTextContent('Thinking');
    expect(screen.getByRole('button', { name: 'Asking…' })).toBeDisabled();

    resolve(answer);
    expect(await screen.findByText('Dodge the lunge, then hit its legs.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
