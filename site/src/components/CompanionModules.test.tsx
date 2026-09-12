import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LinkList, NoteList, QuickReference, VideoList } from './CompanionModules';

describe('QuickReference', () => {
  it('renders each group as a heading over a term/detail list', () => {
    render(
      <QuickReference
        groups={[
          { title: 'Damage types', items: [{ term: 'Smashing', detail: 'Hard shells and armoured bugs.' }] },
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Quick reference' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Damage types' })).toBeInTheDocument();
    expect(screen.getByText('Smashing')).toBeInTheDocument();
    expect(screen.getByText('Hard shells and armoured bugs.')).toBeInTheDocument();
  });
});

describe('LinkList', () => {
  it('renders one external link per entry, with its note', () => {
    render(
      <LinkList
        links={[{ label: 'Grounded Wiki', href: 'https://example.test/wiki', note: 'Creature pages.' }]}
      />,
    );

    const link = screen.getByRole('link', { name: /Grounded Wiki/ });
    expect(link).toHaveAttribute('href', 'https://example.test/wiki');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(screen.getByText('Creature pages.')).toBeInTheDocument();
  });
});

describe('VideoList', () => {
  it('embeds each video by id on the nocookie host, titled for assistive tech', () => {
    render(<VideoList videos={[{ title: 'Base building secrets', youtubeId: 'abc123' }]} />);

    const frame = screen.getByTitle('Base building secrets');
    expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/abc123');
    expect(frame).toHaveAttribute('loading', 'lazy');
    expect(screen.getByRole('heading', { name: 'Base building secrets' })).toBeInTheDocument();
  });
});

describe('NoteList', () => {
  it('renders one item per note with its body', () => {
    render(<NoteList notes={[{ title: 'House rules', body: 'Ask before dismantling.' }]} />);

    expect(screen.getByRole('heading', { name: 'Our notes' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Ask before dismantling.')).toBeInTheDocument();
  });
});
