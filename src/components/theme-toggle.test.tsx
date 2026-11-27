import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { ThemeProvider } from './theme-provider';
import { ThemeToggle } from './theme-toggle';

function renderToggle() {
  return renderWithIntl(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  it('switches between light and dark themes', async () => {
    const user = userEvent.setup();
    renderToggle();
    const button = screen.getByRole('button', { name: 'Toggle theme' });

    await user.click(button);
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');

    await user.click(button);
    expect(document.documentElement).toHaveClass('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  it('does not render an executable theme script on the client', () => {
    const { container } = renderToggle();

    const scripts = [...container.ownerDocument.querySelectorAll('script')];

    expect(scripts.every((script) => script.type === 'application/json')).toBe(true);
  });
});
