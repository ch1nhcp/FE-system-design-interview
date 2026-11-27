import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isTopicSlug } from '@/lib/topics/registry';
import type { TopicSlug } from '@/lib/topics/registry';

import { migrateV1ToV2 } from './progress-migrations';

/** Kept from the v1 checklist so existing progress is migrated instead of lost. */
export const PROGRESS_STORAGE_KEY = 'system-design-checklist';
const STORAGE_VERSION = 2;

export type TopicStatus = 'learned' | 'review';
export type TopicProgress = Readonly<Partial<Record<TopicSlug, TopicStatus>>>;

const persistedStateSchema = z.object({
  topics: z.record(z.string(), z.enum(['learned', 'review'])),
});

type ProgressState = {
  /** Status per topic. Topics without progress are omitted. */
  topics: TopicProgress;
};

type ProgressActions = {
  setStatus: (topic: TopicSlug, status: TopicStatus | null) => void;
  reset: () => void;
};

function withStatus(topics: TopicProgress, topic: TopicSlug, status: TopicStatus | null): TopicProgress {
  if (status) {
    return { ...topics, [topic]: status };
  }
  return Object.fromEntries(Object.entries(topics).filter(([key]) => key !== topic));
}

function onlyKnownTopics(topics: Record<string, TopicStatus>): TopicProgress {
  return Object.fromEntries(Object.entries(topics).filter(([key]) => isTopicSlug(key)));
}

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set) => ({
      topics: {},
      setStatus: (topic, status) => set((state) => ({ topics: withStatus(state.topics, topic, status) })),
      reset: () => set({ topics: {} }),
    }),
    {
      name: PROGRESS_STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ topics: state.topics }),
      migrate: (persisted, version) => (version === 1 ? migrateV1ToV2(persisted) : persisted),
      // localStorage is user-controlled: ignore anything that does not match the expected shape.
      merge: (persisted, current) => {
        const result = persistedStateSchema.safeParse(persisted);
        return result.success ? { ...current, topics: onlyKnownTopics(result.data.topics) } : current;
      },
      // Hydrate after mount so the server-rendered markup matches the first client render.
      skipHydration: true,
    },
  ),
);

export function countLearned(topics: TopicProgress, slugs: readonly TopicSlug[]): number {
  return slugs.filter((slug) => topics[slug] === 'learned').length;
}
