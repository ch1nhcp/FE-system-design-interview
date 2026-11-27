import { useEffect, useEffectEvent } from 'react';
import type { RefObject } from 'react';

const VISIBLE_RATIO = 0.5;

/** Calls `onVisible` once, the first time at least half of the element is on screen. */
export function useAutoPlayWhenVisible(ref: RefObject<Element | null>, onVisible: () => void, enabled: boolean) {
  const handleVisible = useEffectEvent(onVisible);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          handleVisible();
        }
      },
      { threshold: VISIBLE_RATIO },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, enabled]);
}
