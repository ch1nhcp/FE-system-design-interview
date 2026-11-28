import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { push } from '@/test/mock-navigation';
import { renderWithIntl } from '@/test/render-with-intl';

import { SearchLauncher } from './search-launcher';

const engine = vi.hoisted(() => ({ fail: false, empty: false }));
vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'));
vi.mock('fumadocs-core/search/client', async () => {
  const { useState } = await import('react');
  return {
    useStaticSearch: ({ from }: { from: string }) => {
      const [search, onSearchChange] = useState('');
      return {
        search,
        onSearchChange,
        isLoading: false,
        error: engine.fail && from === '/api/search' ? new Error('Network unavailable') : undefined,
        data: {
          query: search,
          items: engine.empty
            ? []
            : [
                {
                  id: 'websockets',
                  url: '/topics/websockets',
                  type: 'page',
                  content: 'WebSockets',
                  breadcrumbs: ['Real-time updates'],
                },
              ],
        },
      };
    },
  };
});

describe('SearchLauncher', () => {
  beforeEach(() => {
    engine.fail = false;
    engine.empty = false;
    push.mockClear();
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('opens through the keyboard shortcut and navigates to a selected result', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SearchLauncher />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    await user.type(await screen.findByRole('combobox', { name: 'Search topics' }), 'socket');
    await user.click(await screen.findByRole('option', { name: /WebSockets/ }));
    expect(push).toHaveBeenCalledWith('/topics/websockets');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('restores focus when the reader dismisses search', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SearchLauncher />);
    const opener = screen.getByRole('button', { name: /Search topics/ });
    await user.click(opener);
    await screen.findByRole('combobox');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('provides a usable retry after the search database cannot load', async () => {
    engine.fail = true;
    const user = userEvent.setup();
    renderWithIntl(<SearchLauncher />);
    await user.click(screen.getByRole('button', { name: /Search topics/ }));
    await user.type(await screen.findByRole('combobox'), 'socket');
    expect(screen.getByRole('alert')).toHaveTextContent('Search could not load');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('option')).toHaveTextContent('WebSockets');
  });

  it('reports an empty result and leaves composition shortcuts alone', async () => {
    engine.empty = true;
    const user = userEvent.setup();
    renderWithIntl(<SearchLauncher />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, isComposing: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Search topics/ }));
    await user.type(await screen.findByRole('combobox'), 'unknown');
    expect(screen.getByRole('status')).toHaveTextContent('No matching topics');
  });
});
