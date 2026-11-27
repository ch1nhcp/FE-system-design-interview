import { beforeEach, describe, expect, it } from 'vitest';

import { PROGRESS_STORAGE_KEY, countLearned, useProgressStore } from './use-progress-store';

function writeStorage(value: unknown) {
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(value));
}

function readStorage(): unknown {
  return JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY) ?? 'null');
}

describe('useProgressStore', () => {
  beforeEach(() => {
    useProgressStore.setState({ topics: {} });
    window.localStorage.clear();
  });

  it('starts with no progress', () => {
    expect(useProgressStore.getState().topics).toEqual({});
  });

  it('sets a status without mutating the previous state', () => {
    const before = useProgressStore.getState().topics;

    useProgressStore.getState().setStatus('websockets', 'learned');

    expect(useProgressStore.getState().topics).toEqual({ websockets: 'learned' });
    expect(before).toEqual({});
  });

  it('replaces the status of a topic and clears it with null', () => {
    const { setStatus } = useProgressStore.getState();
    setStatus('websockets', 'learned');
    setStatus('cors', 'review');

    setStatus('websockets', 'review');
    expect(useProgressStore.getState().topics).toEqual({ websockets: 'review', cors: 'review' });

    setStatus('cors', null);
    expect(useProgressStore.getState().topics).toEqual({ websockets: 'review' });
  });

  it('clears everything on reset', () => {
    useProgressStore.getState().setStatus('xss', 'learned');

    useProgressStore.getState().reset();

    expect(useProgressStore.getState().topics).toEqual({});
  });

  it('persists progress as version 2', () => {
    useProgressStore.getState().setStatus('csp', 'review');

    expect(readStorage()).toEqual({ state: { topics: { csp: 'review' } }, version: 2 });
  });

  it('restores valid version 2 progress and drops unknown topics', async () => {
    writeStorage({ state: { topics: { sitemap: 'learned', removed: 'learned' } }, version: 2 });

    await useProgressStore.persist.rehydrate();

    expect(useProgressStore.getState().topics).toEqual({ sitemap: 'learned' });
  });

  it('ignores stored data with an unexpected shape', async () => {
    writeStorage({ state: { topics: { sitemap: 'done' } }, version: 2 });

    await useProgressStore.persist.rehydrate();

    expect(useProgressStore.getState().topics).toEqual({});
  });

  it('migrates version 1 checklist progress to topics', async () => {
    writeStorage({
      state: {
        checked: {
          'architecture.ssr': true,
          'networking.optimisticUpdates': true,
          'performance.optimisticUpdates': true,
          'images.responsiveImages': true,
          'security.unknownItem': true,
        },
      },
      version: 1,
    });

    await useProgressStore.persist.rehydrate();

    expect(useProgressStore.getState().topics).toEqual({
      'server-side-rendering': 'learned',
      'optimistic-updates': 'learned',
      'responsive-images': 'learned',
    });
  });

  it('starts fresh when version 1 data is malformed', async () => {
    writeStorage({ state: { checked: 'everything' }, version: 1 });

    await useProgressStore.persist.rehydrate();

    expect(useProgressStore.getState().topics).toEqual({});
  });
});

describe('countLearned', () => {
  it('counts only learned topics among the given ones', () => {
    const topics = { websockets: 'learned', cors: 'review', xss: 'learned' } as const;

    expect(countLearned(topics, ['websockets', 'cors', 'csp'])).toBe(1);
  });
});
