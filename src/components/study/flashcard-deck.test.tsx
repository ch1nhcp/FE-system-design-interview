import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProgressStore } from '@/stores/use-progress-store';
import { renderWithIntl } from '@/test/render-with-intl';

import { FlashcardDeck } from './flashcard-deck';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

const topics = [
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
});
