import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useChecklistStore } from '@/stores/use-checklist-store';
import { renderWithIntl } from '@/test/render-with-intl';

import { SystemDesignChecklist } from './system-design-checklist';

function getSectionCard(name: string) {
  const list = screen.getByRole('list', { name });
  const card = list.closest('[data-slot="card"]');
  if (!(card instanceof HTMLElement)) {
    throw new Error(`Expected a card around the "${name}" list`);
  }
  return card;
}

describe('SystemDesignChecklist', () => {
  beforeEach(() => {
    useChecklistStore.setState({ checked: {} });
  });

  it('renders every section with its items unchecked', () => {
    renderWithIntl(<SystemDesignChecklist />);

    expect(screen.getByRole('heading', { level: 1, name: 'Front end system design checklist' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(14);
    expect(screen.getAllByRole('checkbox')).toHaveLength(85);
    expect(screen.getByText('0 of 85 done')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset progress' })).toBeDisabled();
  });

  it('renders code fragments in item labels', () => {
    renderWithIntl(<SystemDesignChecklist />);

    const code = screen.getByText('<picture>');

    expect(code.tagName).toBe('CODE');
    expect(code.closest('label')).toHaveTextContent('Responsive images: srcset, <picture>');
  });

  it('updates section and overall progress when an item is checked', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SystemDesignChecklist />);

    await user.click(screen.getByRole('checkbox', { name: 'Server-side rendering' }));

    expect(screen.getByRole('checkbox', { name: 'Server-side rendering' })).toBeChecked();
    expect(within(getSectionCard('Architecture')).getByText('1/6')).toBeInTheDocument();
    expect(screen.getByText('1 of 85 done')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Checklist progress' })).toHaveAttribute('aria-valuenow', '1');
  });

  it('highlights a section badge once every item in it is checked', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SystemDesignChecklist />);
    const stateManagement = getSectionCard('State management');

    for (const checkbox of within(stateManagement).getAllByRole('checkbox')) {
      await user.click(checkbox);
    }

    const badge = within(stateManagement).getByText('3/3');
    expect(badge).toHaveAttribute('data-variant', 'default');
  });

  it('tracks an item repeated in two sections independently', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SystemDesignChecklist />);

    const networking = getSectionCard('Networking techniques');
    await user.click(within(networking).getByRole('checkbox', { name: 'Optimistic updates' }));

    const performance = getSectionCard('Performance');
    expect(within(performance).getByRole('checkbox', { name: 'Optimistic updates' })).not.toBeChecked();
  });

  it('keeps progress when the reset dialog is cancelled', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SystemDesignChecklist />);
    await user.click(screen.getByRole('checkbox', { name: 'GraphQL' }));

    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('checkbox', { name: 'GraphQL' })).toBeChecked();
  });

  it('unchecks everything when reset is confirmed', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SystemDesignChecklist />);
    await user.click(screen.getByRole('checkbox', { name: 'GraphQL' }));

    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset all progress?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }));

    expect(screen.getByRole('checkbox', { name: 'GraphQL' })).not.toBeChecked();
    expect(screen.getByText('0 of 85 done')).toBeInTheDocument();
  });

  it('restores saved progress after mounting', async () => {
    window.localStorage.setItem(
      'system-design-checklist',
      JSON.stringify({ state: { checked: { 'security.csp': true } }, version: 1 }),
    );

    renderWithIntl(<SystemDesignChecklist />);

    expect(await screen.findByText('1 of 85 done')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'CSP' })).toBeChecked();
  });
});
