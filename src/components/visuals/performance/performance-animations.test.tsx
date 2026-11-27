import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { LoadingAnimation } from './loading-animation';
import { RateAnimation } from './rate-animation';
import { VirtualizationAnimation } from './virtualization-animation';

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function stat(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;
}

async function finishTimeline() {
  const user = userEvent.setup();
  const next = screen.getByRole('button', { name: 'Next step' });
  for (let step = 0; step < 40 && !next.hasAttribute('disabled'); step++) await user.click(next);
  expect(next).toBeDisabled();
}

describe('performance animations', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  });

  it('compares retained values and dispatch counts across rate policies', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RateAnimation />);
    await finishTimeline();
    expect(stat('Dispatches')).toBe('2');
    expect(stat('Last value')).toBe('7');
    await user.click(screen.getByRole('button', { name: 'Throttle' }));
    expect(stat('Dispatches')).toBe('0');
    expect(screen.getByRole('button', { name: 'Previous step' })).toBeDisabled();
    await finishTimeline();
    expect(stat('Dispatches')).toBe('3');
  });

  it('shows parallel and serial completion with the same resource set', async () => {
    const user = userEvent.setup();
    renderWithIntl(<LoadingAnimation />);
    await finishTimeline();
    expect(stat('Content visible')).toBe('900 ms');
    expect(screen.getByText('Content is visible')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Sequential' }));
    expect(screen.getByText('Waiting for critical content')).toBeVisible();
    await finishTimeline();
    expect(stat('Content visible')).toBe('2100 ms');
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(stat('Resources ready')).toBe('0/4');
  });

  it('keeps the viewport sketch while changing the modeled mounted count', async () => {
    const user = userEvent.setup();
    renderWithIntl(<VirtualizationAnimation />);
    expect(stat('Mounted rows')).toBe('7');
    await finishTimeline();
    expect(screen.getByText('Visible rows 996 to 1000')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'All rows' }));
    expect(stat('Mounted rows')).toBe('1000');
    expect(screen.getByText('Visible rows 1 to 5')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    await user.click(screen.getByRole('button', { name: 'Previous step' }));
    expect(screen.getByText('Visible rows 1 to 5')).toBeVisible();
  });
});
