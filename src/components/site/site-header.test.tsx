import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { SiteHeader } from './site-header';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

describe('SiteHeader', () => {
  it('links home and to the main pages, with theme, language and menu controls', () => {
    renderWithIntl(<SiteHeader />);
    const header = screen.getByRole('banner');

    expect(within(header).getByRole('link', { name: 'FE System Design' })).toHaveAttribute('href', '/');
    const mainNav = within(header).getByRole('navigation', { name: 'Main' });
    expect(within(mainNav).getByRole('link', { name: 'Framework' })).toHaveAttribute('href', '/framework');
    expect(within(mainNav).getByRole('link', { name: 'Flashcards' })).toHaveAttribute('href', '/flashcards');
    expect(within(header).getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'EN' })).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'Open navigation' })).toBeInTheDocument();
  });
});
