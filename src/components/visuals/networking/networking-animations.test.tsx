import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { RaceAnimation } from './race-animation';
import { RetryAnimation } from './retry-animation';

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

async function finishTimeline() {
  const user = userEvent.setup();
  const next = screen.getByRole('button', { name: 'Next step' });
  for (let step = 0; step < 25 && !next.hasAttribute('disabled'); step++) {
    await user.click(next);
  }
  expect(next).toBeDisabled();
}

describe('networking animations', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  });

  it('steps retries to recovery and resets the frame when the policy changes', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RetryAnimation />);
    expect(screen.getByRole('button', { name: 'Jitter' })).toHaveAttribute('aria-pressed', 'true');
    await finishTimeline();
    expect(screen.getByText('All three clients have succeeded on their third attempt.')).toBeVisible();
    expect(screen.getByText('3/3')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Backoff' }));
    expect(screen.getByText('0/3')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Previous step' })).toBeDisabled();
    expect(screen.getByText('Three clients are about to make the same read.')).toBeVisible();
  });

  it('compares accepting stale results with a latest-generation guard', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RaceAnimation />);
    await finishTimeline();
    expect(screen.getByText('The older r response arrives but is ignored. Results still match react.')).toBeVisible();

    const modes = screen.getByRole('group', { name: 'Response handling' });
    await user.click(within(modes).getByRole('button', { name: 'Unguarded' }));
    expect(screen.getAllByText('None yet', { selector: 'strong' })).toHaveLength(2);
    await finishTimeline();
    expect(
      screen.getByText('The older r response overwrites the newer results. The input still says react.'),
    ).toBeVisible();
    expect(screen.getByText('r', { selector: 'strong' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(screen.getByRole('button', { name: 'Previous step' })).toBeDisabled();
  });
});
