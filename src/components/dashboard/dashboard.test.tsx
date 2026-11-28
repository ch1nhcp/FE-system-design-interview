import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProgressStore } from '@/stores/use-progress-store';
import { renderWithIntl } from '@/test/render-with-intl';

import { Dashboard } from './dashboard';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

function getSectionCard(name: string) {
  const list = screen.getByRole('list', { name });
  const card = list.closest('[data-slot="card"]');
  if (!(card instanceof HTMLElement)) {
    throw new Error(`Expected a card around the "${name}" list`);
  }
  return card;
}

describe('Dashboard', () => {
  beforeEach(() => {
    useProgressStore.setState({ topics: {} });
  });

  it('lists every section and topic with no progress', () => {
    renderWithIntl(<Dashboard />);

    expect(screen.getByRole('heading', { level: 1, name: 'Front end system design checklist' })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(85);
    expect(screen.getByText('0 of 81 done')).toBeInTheDocument();
    expect(screen.getByText('Topics you mark as "Review again" show up here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset progress' })).toBeDisabled();
  });

  it('links sections and topics to their pages', () => {
    renderWithIntl(<Dashboard />);

    expect(screen.getByRole('link', { name: 'Real-time updates' })).toHaveAttribute(
      'href',
      '/sections/real-time-updates',
    );
    expect(screen.getByRole('link', { name: 'WebSockets' })).toHaveAttribute('href', '/topics/websockets');
  });

  it('marks a topic as learned and updates section and overall progress', async () => {
    const user = userEvent.setup();
    renderWithIntl(<Dashboard />);

    await user.click(screen.getByRole('checkbox', { name: 'Learned: WebSockets' }));

    expect(useProgressStore.getState().topics).toEqual({ websockets: 'learned' });
    expect(within(getSectionCard('Real-time updates')).getByText('1/4')).toBeInTheDocument();
    expect(screen.getByText('1 of 81 done')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Checklist progress' })).toHaveAttribute('aria-valuenow', '1');
  });

  it('keeps a topic shared by two sections in sync', async () => {
    const user = userEvent.setup();
    renderWithIntl(<Dashboard />);

    await user.click(
      within(getSectionCard('Networking techniques')).getByRole('checkbox', { name: 'Learned: Optimistic updates' }),
    );

    expect(
      within(getSectionCard('Performance')).getByRole('checkbox', { name: 'Learned: Optimistic updates' }),
    ).toBeChecked();
    expect(screen.getByText('1 of 81 done')).toBeInTheDocument();
  });

  it('uses plain text for checkbox labels of topics with code', () => {
    renderWithIntl(<Dashboard />);

    expect(screen.getByRole('checkbox', { name: 'Learned: Responsive images: srcset, <picture>' })).toBeInTheDocument();
  });

  it('lists topics to review again and does not count them as learned', () => {
    useProgressStore.setState({ topics: { cors: 'review', xss: 'learned' } });
    renderWithIntl(<Dashboard />);

    const review = screen.getByRole('region', { name: 'Review again' });
    expect(within(review).getByRole('link', { name: 'CORS' })).toHaveAttribute('href', '/topics/cors');
    expect(screen.getByText('1 of 81 done')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Learned: CORS' })).not.toBeChecked();
  });

  it('filters the checklist to topics marked for review without changing overall progress', async () => {
    const user = userEvent.setup();
    useProgressStore.setState({ topics: { cors: 'review', xss: 'learned' } });
    renderWithIntl(<Dashboard />);
    await user.click(screen.getByRole('radio', { name: 'Review again' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByRole('checkbox', { name: 'Learned: CORS' })).toBeInTheDocument();
    expect(screen.getByText('1 of 81 done')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Learned: CORS' }));
    expect(screen.getByRole('status')).toHaveFocus();
    await user.click(screen.getByRole('radio', { name: 'All topics' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(85);
  });

  it('highlights a section once every topic in it is learned', () => {
    useProgressStore.setState({
      topics: { 'event-sourcing': 'learned', 'flux-architecture': 'learned', 'normalized-state': 'learned' },
    });
    renderWithIntl(<Dashboard />);

    expect(within(getSectionCard('State management')).getByText('3/3')).toHaveAttribute('data-variant', 'default');
  });

  it('keeps progress when reset is cancelled and clears it when confirmed', async () => {
    const user = userEvent.setup();
    useProgressStore.setState({ topics: { graphql: 'learned', cors: 'review' } });
    renderWithIntl(<Dashboard />);

    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('checkbox', { name: 'Learned: GraphQL' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset all progress?' });
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }));

    expect(useProgressStore.getState().topics).toEqual({});
    expect(screen.getByText('0 of 81 done')).toBeInTheDocument();
  });
});
