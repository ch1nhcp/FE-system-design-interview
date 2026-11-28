import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSection } from '@/lib/topics/registry';
import { useProgressStore } from '@/stores/use-progress-store';
import { renderWithIntl } from '@/test/render-with-intl';

import { SectionTopicList } from './section-topic-list';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

const section = getSection('real-time-updates');
if (!section) {
  throw new Error('Expected the real-time-updates section');
}
const topics = section.topics.map((topic) => ({ topic, summary: `Summary for ${topic}.` }));

describe('SectionTopicList', () => {
  beforeEach(() => {
    useProgressStore.setState({ topics: {} });
  });

  it('lists completed topics with their summaries', () => {
    renderWithIntl(<SectionTopicList topics={topics} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'WebSockets' })).toHaveAttribute('href', '/topics/websockets');
    for (const topic of topics) {
      expect(screen.getByText(topic.summary)).toBeInTheDocument();
    }
  });

  it('shows how many topics are learned and the status of each', () => {
    useProgressStore.setState({ topics: { 'short-polling': 'learned', 'long-polling': 'review' } });
    renderWithIntl(<SectionTopicList topics={topics} />);

    expect(screen.getByText('4 topics · 1/4 learned')).toBeInTheDocument();
    const shortPolling = screen.getByRole('link', { name: 'Short polling' }).closest('li');
    const longPolling = screen.getByRole('link', { name: 'Long polling' }).closest('li');
    expect(shortPolling).toHaveTextContent('Learned');
    expect(longPolling).toHaveTextContent('Review again');
  });
});
