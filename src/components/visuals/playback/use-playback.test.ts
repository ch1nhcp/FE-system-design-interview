import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlayback } from './use-playback';

const options = { duration: 1000, stops: [0, 200, 500, 1000] };

describe('usePlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts paused at time 0', () => {
    const { result } = renderHook(() => usePlayback(options));

    expect(result.current.time).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });

  it('advances with animation frames while playing', () => {
    const { result } = renderHook(() => usePlayback(options));

    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(400));

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.time).toBeGreaterThan(300);
    expect(result.current.time).toBeLessThanOrEqual(400);
  });

  it('stops at the end of the timeline', () => {
    const { result } = renderHook(() => usePlayback(options));

    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(2000));

    expect(result.current.time).toBe(1000);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isAtEnd).toBe(true);
  });

  it('restarts from the beginning when played at the end', () => {
    const { result } = renderHook(() => usePlayback(options));
    act(() => result.current.seek(1000));

    act(() => result.current.play());

    expect(result.current.time).toBe(0);
    expect(result.current.isPlaying).toBe(true);
  });

  it('freezes time when paused', () => {
    const { result } = renderHook(() => usePlayback(options));
    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(300));

    act(() => result.current.pause());
    const pausedAt = result.current.time;
    act(() => vi.advanceTimersByTime(300));

    expect(result.current.time).toBe(pausedAt);
  });

  it('steps between stops and pauses playback', () => {
    const { result } = renderHook(() => usePlayback(options));
    act(() => result.current.play());

    act(() => result.current.stepForward());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.time).toBe(200);

    act(() => result.current.stepForward());
    expect(result.current.time).toBe(500);

    act(() => result.current.stepBack());
    expect(result.current.time).toBe(200);
  });

  it('clamps steps at both ends', () => {
    const { result } = renderHook(() => usePlayback(options));

    act(() => result.current.stepBack());
    expect(result.current.time).toBe(0);
    expect(result.current.isAtStart).toBe(true);

    act(() => result.current.seek(1000));
    act(() => result.current.stepForward());
    expect(result.current.time).toBe(1000);
  });

  it('restart goes back to the start and pauses', () => {
    const { result } = renderHook(() => usePlayback(options));
    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(300));

    act(() => result.current.restart());

    expect(result.current.time).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });
});
