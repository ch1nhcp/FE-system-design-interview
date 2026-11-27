import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { LocaleSwitcher } from './locale-switcher';

const replace = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace }),
}));

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?tab=checklist#performance');
  });

  afterEach(() => {
    replace.mockClear();
    window.history.replaceState(null, '', '/');
  });

  it('shows the active locale', () => {
    renderWithIntl(<LocaleSwitcher />);

    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
  });

  it('switches locale while keeping the query string and hash', async () => {
    const user = userEvent.setup();
    renderWithIntl(<LocaleSwitcher />);

    await user.click(screen.getByRole('button', { name: 'EN' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'VI' }));

    expect(replace).toHaveBeenCalledExactlyOnceWith('/?tab=checklist#performance', { locale: 'vi' });
  });

  it('lists every supported locale', async () => {
    const user = userEvent.setup();
    renderWithIntl(<LocaleSwitcher />);

    await user.click(screen.getByRole('button', { name: 'EN' }));

    const options = await screen.findAllByRole('menuitemradio');
    expect(options.map((option) => option.textContent)).toEqual(['EN', 'VI']);
  });
});
