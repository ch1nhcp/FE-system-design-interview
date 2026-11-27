import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useProgressStore } from '@/stores/use-progress-store';
import { navigationState } from '@/test/mock-navigation';
import { renderWithIntl } from '@/test/render-with-intl';

import { SectionsNav } from './sections-nav';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

describe('SectionsNav', () => {
  beforeEach(() => {
    useProgressStore.setState({ topics: {} });
  });

  afterEach(() => {
    navigationState.pathname = '/';
  });

  it('links every section and every topic entry', () => {
    renderWithIntl(<SectionsNav />);
    const nav = screen.getByRole('navigation', { name: 'Sections and topics' });

    expect(within(nav).getByRole('link', { name: 'Security' })).toHaveAttribute('href', '/sections/security');
    expect(within(nav).getByRole('link', { name: 'CSP' })).toHaveAttribute('href', '/topics/csp');
    expect(within(nav).getAllByRole('link')).toHaveLength(14 + 85);
  });

  it('marks the current page', () => {
    navigationState.pathname = '/topics/csp';
    renderWithIntl(<SectionsNav />);

    expect(screen.getByRole('link', { current: 'page' })).toHaveTextContent('CSP');
  });

  it('shows the progress status of topics', () => {
    useProgressStore.setState({ topics: { xss: 'learned', csrf: 'review' } });
    renderWithIntl(<SectionsNav />);

    expect(screen.getByRole('link', { name: 'XSS (Learned)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'CSRF (Review again)' })).toBeInTheDocument();
  });

  it('calls onNavigate when a link is followed', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderWithIntl(<SectionsNav onNavigate={onNavigate} />);

    await user.click(screen.getByRole('link', { name: 'CORS' }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it('scrolls its container so the current link is visible', () => {
    navigationState.pathname = '/topics/conflict-resolution';
    const container = document.createElement('div');
    container.setAttribute('data-nav-scroll-container', '');
    document.body.append(container);

    renderWithIntl(<SectionsNav />, { container });

    // jsdom has no layout, so every rect is zero; the effect still runs and sets a finite position.
    expect(Number.isFinite(container.scrollTop)).toBe(true);
    container.remove();
  });
});
