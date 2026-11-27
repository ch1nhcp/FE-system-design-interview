import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const STORAGE_KEY = 'system-design-checklist';
const STORAGE_VERSION = 1;

const persistedStateSchema = z.object({
  checked: z.record(z.string(), z.boolean()),
});

type ChecklistState = {
  /** Checked item keys (`<sectionId>.<itemId>`). Unchecked items are omitted. */
  checked: Readonly<Record<string, boolean>>;
};

type ChecklistActions = {
  setChecked: (key: string, value: boolean) => void;
  reset: () => void;
};

function withCheckedValue(
  checked: Readonly<Record<string, boolean>>,
  key: string,
  value: boolean,
): Readonly<Record<string, boolean>> {
  if (value) {
    return { ...checked, [key]: true };
  }
  return Object.fromEntries(Object.entries(checked).filter(([entryKey]) => entryKey !== key));
}

export const useChecklistStore = create<ChecklistState & ChecklistActions>()(
  persist(
    (set) => ({
      checked: {},
      setChecked: (key, value) => set((state) => ({ checked: withCheckedValue(state.checked, key, value) })),
      reset: () => set({ checked: {} }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ checked: state.checked }),
      // localStorage is user-controlled: ignore anything that does not match the expected shape.
      merge: (persisted, current) => {
        const result = persistedStateSchema.safeParse(persisted);
        return result.success ? { ...current, checked: result.data.checked } : current;
      },
      // Hydrate after mount so the server-rendered markup matches the first client render.
      skipHydration: true,
    },
  ),
);
