'use client';

import { useEffect } from 'react';

import { useProgressStore } from '@/stores/use-progress-store';

/** Loads saved progress once on the client, after hydration, so server and client markup match. */
export function ProgressHydrator() {
  useEffect(() => {
    void useProgressStore.persist.rehydrate();
  }, []);

  return null;
}
