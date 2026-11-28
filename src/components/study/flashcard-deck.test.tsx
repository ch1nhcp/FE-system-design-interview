import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StudyTopic } from '@/lib/content/study-types';
import { useProgressStore } from '@/stores/use-progress-store';
import { renderWithIntl } from '@/test/render-with-intl';

import { FlashcardDeck } from './flashcard-deck';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

const topics: [StudyTopic] = [
  {
    topic: 'websockets' as const,
    title: 'WebSockets',
    description: 'A two-way connection.',
    sections: ['real-time-updates' as const],
    contentLanguage: 'en' as const,
    cards: [
      {
        id: 'websockets:1',
        topic: 'websockets' as const,
        question: 'How do you reconnect?',
        answer: [{ type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Use bounded backoff.' }] }],
      },
      {
        id: 'websockets:2',
        topic: 'websockets' as const,
        question: 'How do you resume?',
        answer: [
          {
            type: 'paragraph' as const,
            children: [{ type: 'text' as const, text: 'Resume from an acknowledged event.' }],
          },
        ],
      },
    ],
  },
];

describe('FlashcardDeck', () => {
  beforeEach(() => useProgressStore.setState({ topics: {} }));

  it('lets a reader attempt a question, reveal its answer and move to a fresh question', async () => {
    const user = userEvent.setup();
    renderWithIntl(<FlashcardDeck topics={topics} />);
    expect(screen.getByRole('heading', { name: 'How do you reconnect?' })).toBeInTheDocument();
    expect(screen.queryByText('Use bounded backoff.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(screen.getByText('Use bounded backoff.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Next card' }));
    expect(screen.getByRole('heading', { name: 'How do you resume?' })).toBeInTheDocument();
    expect(screen.queryByText('Resume from an acknowledged event.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous card' }));
    expect(screen.getByRole('heading', { name: 'How do you reconnect?' })).toBeInTheDocument();
    expect(screen.queryByText('Use bounded backoff.')).not.toBeInTheDocument();
  });

  it('filters review cards using shared topic progress and keeps recovery available after learning a topic', async () => {
    const user = userEvent.setup();
    useProgressStore.setState({ topics: { websockets: 'review' } });
    renderWithIntl(<FlashcardDeck topics={topics} />);
    await user.click(screen.getByRole('radio', { name: 'Review again' }));
    await user.click(screen.getByRole('button', { name: 'Mark topic learned' }));
    expect(useProgressStore.getState().topics.websockets).toBe('learned');
    expect(screen.getByText('No cards to review')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all cards' }));
    expect(screen.getByRole('heading', { name: 'How do you reconnect?' })).toBeInTheDocument();
  });

  it('starts the next reviewed topic at its first question when learning a topic from a later card', async () => {
    const user = userEvent.setup();
    useProgressStore.setState({ topics: { websockets: 'review', graphql: 'review' } });
    const nextTopic = {
      ...topics[0],
      topic: 'graphql' as const,
      title: 'GraphQL',
      cards: topics[0].cards.map((card, index) => ({
        ...card,
        id: `graphql:${index + 1}`,
        topic: 'graphql' as const,
        question: `GraphQL question ${index + 1}`,
      })),
    };
    renderWithIntl(<FlashcardDeck topics={[...topics, nextTopic]} />);
    await user.click(screen.getByRole('radio', { name: 'Review again' }));
    await user.click(screen.getByRole('button', { name: 'Next card' }));
    await user.click(screen.getByRole('button', { name: 'Mark topic learned' }));
    expect(screen.getByRole('heading', { name: 'GraphQL question 1' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Card 1 of 2');
  });
});
