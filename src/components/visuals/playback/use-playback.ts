import { useEffect, useState } from 'react';

type PlaybackOptions = {
  /** Length of the timeline in ms. */
  duration: number;
  /** Sorted times the step buttons jump between. */
  stops: readonly number[];
};

export type Playback = {
  time: number;
  isPlaying: boolean;
  isAtStart: boolean;
  isAtEnd: boolean;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBack: () => void;
  restart: () => void;
  seek: (time: number) => void;
};

/** Drives a timeline with `requestAnimationFrame`: playing advances `time` in real milliseconds until `duration`. */
export function usePlayback({ duration, stops }: PlaybackOptions): Playback {
  const [time, setTime] = useState(0);
  const [wantsToPlay, setWantsToPlay] = useState(false);

  const isAtEnd = time >= duration;
  const isPlaying = wantsToPlay && !isAtEnd;

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let frame = 0;
    let previous: number | null = null;

    const tick = (now: number) => {
      const elapsed = previous === null ? 0 : now - previous;
      previous = now;
      setTime((current) => Math.min(current + elapsed, duration));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, duration]);

  const clamp = (value: number) => Math.min(Math.max(value, 0), duration);

  return {
    time,
    isPlaying,
    isAtStart: time <= 0,
    isAtEnd,
    play: () => {
      if (isAtEnd) {
        setTime(0);
      }
      setWantsToPlay(true);
    },
    pause: () => setWantsToPlay(false),
    stepForward: () => {
      setWantsToPlay(false);
      setTime(clamp(stops.find((stop) => stop > time) ?? duration));
    },
    stepBack: () => {
      setWantsToPlay(false);
      setTime(clamp(stops.filter((stop) => stop < time).at(-1) ?? 0));
    },
    restart: () => {
      setWantsToPlay(false);
      setTime(0);
    },
    seek: (value: number) => setTime(clamp(value)),
  };
}
