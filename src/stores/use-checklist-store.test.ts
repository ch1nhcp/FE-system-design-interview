import { beforeEach, describe, expect, it } from 'vitest';

import { useChecklistStore } from './use-checklist-store';

const STORAGE_KEY = 'system-design-checklist';

function writeStorage(value: unknown) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

describe('useChecklistStore', () => {
  beforeEach(() => {
    useChecklistStore.setState({ checked: {} });
    window.localStorage.clear();
  });

  it('starts with nothing checked', () => {
    expect(useChecklistStore.getState().checked).toEqual({});
  });

  it('checks an item without mutating the previous state', () => {
    const before = useChecklistStore.getState().checked;

    useChecklistStore.getState().setChecked('architecture.ssr', true);

    expect(useChecklistStore.getState().checked).toEqual({ 'architecture.ssr': true });
    expect(before).toEqual({});
  });

  it('removes an item when it is unchecked', () => {
    const { setChecked } = useChecklistStore.getState();
    setChecked('architecture.ssr', true);
    setChecked('architecture.csr', true);

    setChecked('architecture.ssr', false);

    expect(useChecklistStore.getState().checked).toEqual({ 'architecture.csr': true });
  });

  it('clears every item on reset', () => {
    useChecklistStore.getState().setChecked('architecture.ssr', true);

    useChecklistStore.getState().reset();

    expect(useChecklistStore.getState().checked).toEqual({});
  });

  it('persists checked items to localStorage', () => {
    useChecklistStore.getState().setChecked('security.xss', true);

    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');

    expect(stored).toEqual({ state: { checked: { 'security.xss': true } }, version: 1 });
  });

  it('restores valid persisted progress on rehydrate', async () => {
    writeStorage({ state: { checked: { 'seo.sitemap': true } }, version: 1 });

    await useChecklistStore.persist.rehydrate();

    expect(useChecklistStore.getState().checked).toEqual({ 'seo.sitemap': true });
  });

  it('ignores persisted data with an unexpected shape', async () => {
    writeStorage({ state: { checked: ['seo.sitemap'] }, version: 1 });

    await useChecklistStore.persist.rehydrate();

    expect(useChecklistStore.getState().checked).toEqual({});
  });
});
