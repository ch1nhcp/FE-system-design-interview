import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { MobileNav } from './mobile-nav';

vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));

describe('MobileNav', () => {
  it('opens a drawer with the main links and every section, and closes after navigating', async () => {
    const user = userEvent.setup();
    renderWithIntl(<MobileNav />);

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    const drawer = screen.getByRole('dialog', { name: 'FE System Design' });
    expect(drawer).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Framework' })).toHaveAttribute('href', '/framework');
    expect(screen.getByRole('link', { name: 'Accessibility' })).toHaveAttribute('href', '/sections/accessibility');

    await user.click(screen.getByRole('link', { name: 'XSS' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
