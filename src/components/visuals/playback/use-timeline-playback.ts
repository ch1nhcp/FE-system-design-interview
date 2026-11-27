import { useRef } from 'react';

import { useAutoPlayWhenVisible } from './use-autoplay-when-visible';
import { usePlayback } from './use-playback';
import type { Playback } from './use-playback';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

/** Quiet moment before the first event, so "start" shows an idle state and the first step shows the first event. */
export const LEAD_IN = 400;

type Options = {
  /** Length of the timeline in ms, without the lead-in. */
  duration: number;
  /** Sorted times worth stepping to, without the lead-in. */
  stops: readonly number[];
};

/**
 * Playback for an animated timeline: adds a short lead-in, autoplays once the figure is half visible
 * (unless the user prefers reduced motion) and reports time on the timeline's own axis (negative during the lead-in).
 */
export function useTimelinePlayback({ duration, stops }: Options) {
  const figureRef = useRef<HTMLElement>(null);
  const playback: Playback = usePlayback({
    duration: duration + LEAD_IN,
    stops: stops.map((stop) => stop + LEAD_IN),
  });
  const reducedMotion = usePrefersReducedMotion();
  useAutoPlayWhenVisible(figureRef, playback.play, !reducedMotion);

  return { figureRef, playback, time: playback.time - LEAD_IN };
}
