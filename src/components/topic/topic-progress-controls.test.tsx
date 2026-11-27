import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useProgressStore } from '@/stores/use-progress-store';
import { renderWithIntl } from '@/test/render-with-intl';

import { TopicProgressControls } from './topic-progress-controls';

describe('TopicProgressControls', () => {
  beforeEach(() => {
    useProgressStore.setState({ topics: {} });
  });

  it('marks and unmarks the topic as learned', async () => {
    const user = userEvent.setup();
    renderWithIntl(<TopicProgressControls topic="websockets" />);
    const learned = screen.getByRole('checkbox', { name: 'Learned' });

    await user.click(learned);
    expect(learned).toBeChecked();
    expect(useProgressStore.getState().topics).toEqual({ websockets: 'learned' });

    await user.click(learned);
    expect(useProgressStore.getState().topics).toEqual({});
  });

  it('toggles review again, which replaces learned', async () => {
    const user = userEvent.setup();
    useProgressStore.setState({ topics: { websockets: 'learned' } });
    renderWithIntl(<TopicProgressControls topic="websockets" />);
    const review = screen.getByRole('button', { name: 'Review again' });

    await user.click(review);
    expect(review).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('checkbox', { name: 'Learned' })).not.toBeChecked();
    expect(useProgressStore.getState().topics).toEqual({ websockets: 'review' });

    await user.click(review);
    expect(review).toHaveAttribute('aria-pressed', 'false');
    expect(useProgressStore.getState().topics).toEqual({});
  });

  it('groups the controls under an accessible name', () => {
    renderWithIntl(<TopicProgressControls topic="websockets" />);

    expect(screen.getByRole('group', { name: 'Progress' })).toBeInTheDocument();
  });
});
