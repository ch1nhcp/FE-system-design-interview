import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { RenderingTimelineAnimation } from './rendering-timeline-animation';

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function getStat(name: string) {
  return screen.getByText(name, { selector: 'dt' }).nextElementSibling?.textContent;
}

async function stepUntil(text: RegExp) {
  const user = userEvent.setup();
  const next = screen.getByRole('button', { name: 'Next step' });
  while (!screen.queryByText(text) && !next.hasAttribute('disabled')) {
    await user.click(next);
  }
}

describe('RenderingTimelineAnimation', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  });

  it('starts on the requested strategy with a blank screen', () => {
    renderWithIntl(<RenderingTimelineAnimation initialMode="ssr" />);

    const modes = screen.getByRole('group', { name: 'Strategy' });
    expect(
      within(modes)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['CSR', 'SSR', 'SSG / ISR', 'Streaming']);
    expect(within(modes).getByRole('button', { name: 'SSR' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: 'Blank screen' })).toBeInTheDocument();
    expect(getStat('JavaScript')).toBe('180 kB');
  });

  it('shows SSR content that is not interactive until hydration', async () => {
    renderWithIntl(<RenderingTimelineAnimation initialMode="ssr" />);

    await stepUntil(/JavaScript that makes it work is still downloading/);
    expect(screen.getByRole('img', { name: 'Full page' })).toBeInTheDocument();
    expect(screen.getByText('Not interactive yet')).toBeInTheDocument();
    expect(getStat('Content visible')).toBe('700 ms');
    expect(getStat('Interactive')).toBe('…');

    await stepUntil(/The page is now interactive/);
    expect(getStat('Interactive')).toBe('1500 ms');
  });

  it('shows a spinner during client-side rendering and a placeholder while streaming', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RenderingTimelineAnimation />);

    await stepUntil(/downloads the whole JavaScript bundle/);
    expect(screen.getByRole('img', { name: 'Loading spinner' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Streaming' }));
    await stepUntil(/Interactive, even though the slow part is still loading/);
    expect(screen.getByRole('img', { name: 'Page with a placeholder for the slow part' })).toBeInTheDocument();
    expect(getStat('JavaScript')).toBe('40 kB');
  });
});
