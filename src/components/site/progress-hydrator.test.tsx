import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { PROGRESS_STORAGE_KEY, useProgressStore } from '@/stores/use-progress-store';

import { ProgressHydrator } from './progress-hydrator';

describe('ProgressHydrator', () => {
  beforeEach(() => {
    useProgressStore.setState({ topics: {} });
  });

  it('loads saved progress after mounting', async () => {
    window.localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ state: { topics: { csp: 'learned' } }, version: 2 }),
    );

    render(<ProgressHydrator />);

    await waitFor(() => expect(useProgressStore.getState().topics).toEqual({ csp: 'learned' }));
  });
});
