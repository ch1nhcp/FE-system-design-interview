import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { RealtimeTransportAnimation } from './realtime-transport-animation';

type ObserverCallback = (entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>) => void;

const observers: ObserverCallback[] = [];

class IntersectionObserverStub {
  constructor(callback: ObserverCallback) {
    observers.push(callback);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

function scrollIntoView() {
  act(() => {
    for (const callback of observers) {
      callback([{ isIntersecting: true }]);
    }
  });
}

function prefersReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matches && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function getStat(name: string) {
  const term = screen.getByText(name, { selector: 'dt' });
  return term.nextElementSibling?.textContent;
}

describe('RealtimeTransportAnimation', () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    prefersReducedMotion(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts on short polling, idle and paused', () => {
    renderWithIntl(<RealtimeTransportAnimation />);

    expect(screen.getByRole('button', { name: 'Short polling' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'WebSocket' })).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.getByRole('img', {
        name: 'Sequence diagram of Short polling between client and server over 9 seconds',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Press play, or step through the timeline.')).toBeInTheDocument();
    expect(getStat('HTTP requests')).toBe('0');
    expect(getStat('Average delay')).toBe('n/a');
    expect(screen.getByRole('button', { name: 'Previous step' })).toBeDisabled();
  });

  it('steps through the polling timeline with captions and stats', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RealtimeTransportAnimation />);
    const next = screen.getByRole('button', { name: 'Next step' });

    await user.click(next);
    expect(screen.getByText('Client asks the server: anything new?')).toBeInTheDocument();
    expect(getStat('HTTP requests')).toBe('1');

    await user.click(next);
    await user.click(next);
    expect(screen.getByText('Nothing new. That round trip was wasted.')).toBeInTheDocument();
    expect(getStat('Wasted round trips')).toBe('1');
  });

  it('shows the final polling stats at the end of the timeline', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RealtimeTransportAnimation />);
    const next = screen.getByRole('button', { name: 'Next step' });

    while (!next.hasAttribute('disabled')) {
      await user.click(next);
    }

    expect(getStat('HTTP requests')).toBe('5');
    expect(getStat('Wasted round trips')).toBe('3');
    expect(getStat('Average delay')).toBe('1533 ms');
  });

  it('switches to WebSocket and starts over', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RealtimeTransportAnimation />);
    await user.click(screen.getByRole('button', { name: 'Next step' }));

    await user.click(screen.getByRole('button', { name: 'WebSocket' }));

    expect(screen.getByRole('button', { name: 'WebSocket' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Press play, or step through the timeline.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText('Client opens a WebSocket with an HTTP upgrade request.')).toBeInTheDocument();
  });

  it('offers all four transports and starts on the one a topic asks for', () => {
    renderWithIntl(<RealtimeTransportAnimation initialMode="longPolling" />);
    const modes = screen.getByRole('group', { name: 'Transport' });

    expect(
      within(modes)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Short polling', 'Long polling', 'SSE', 'WebSocket']);
    expect(within(modes).getByRole('button', { name: 'Long polling' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Request held open by the server')).toBeInTheDocument();
  });

  it('explains that SSE needs a separate request to send data', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RealtimeTransportAnimation initialMode="serverSentEvents" />);
    const next = screen.getByRole('button', { name: 'Next step' });

    while (!screen.queryByText(/separate HTTP request/)) {
      await user.click(next);
    }

    expect(screen.getByText('Open connection')).toBeInTheDocument();
    expect(getStat('HTTP requests')).toBe('2');
  });

  it('autoplays once it scrolls into view', () => {
    renderWithIntl(<RealtimeTransportAnimation />);
    const controls = screen.getByRole('group', { name: 'Animation controls' });
    expect(within(controls).getByRole('button', { name: 'Play' })).toBeInTheDocument();

    scrollIntoView();

    expect(within(controls).getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('does not autoplay when the user prefers reduced motion', () => {
    prefersReducedMotion(true);
    renderWithIntl(<RealtimeTransportAnimation />);

    scrollIntoView();

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('announces captions politely to assistive technology', () => {
    renderWithIntl(<RealtimeTransportAnimation />);

    const caption = screen.getByText('Press play, or step through the timeline.');

    expect(caption).toHaveAttribute('aria-live', 'polite');
  });
});
