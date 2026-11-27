import { describe, expect, it } from 'vitest';

import { buildLoadingTimeline, getLoadingState } from './loading-model';
import { RATE_MODES, buildRateTimeline, getRateState } from './rate-model';
import { LIST_TIMELINE, getListState, getListWindow } from './virtualization-model';

describe('rate policies', () => {
  it('trailing debounce retains the last value of each settled burst', () => {
    const timeline = buildRateTimeline('debounce');
    expect(timeline.dispatches).toEqual([
      { at: 800, value: 6 },
      { at: 1300, value: 7 },
    ]);
    expect(getRateState(timeline, 600)).toMatchObject({ inputs: 6, dispatches: 0, value: null });
  });

  it('leading throttle emits during continuous input and drops values inside each interval', () => {
    const timeline = buildRateTimeline('throttle');
    expect(timeline.dispatches).toEqual([
      { at: 0, value: 1 },
      { at: 300, value: 4 },
      { at: 1000, value: 7 },
    ]);
    expect(getRateState(timeline, 600)).toMatchObject({ inputs: 6, dispatches: 2, value: 4 });
  });

  it.each(RATE_MODES)('can step to every event and return to the idle frame in %s mode', (mode) => {
    const timeline = buildRateTimeline(mode);
    for (const event of [...timeline.inputs, ...timeline.dispatches]) expect(timeline.stops).toContain(event.at);
    expect(getRateState(timeline, timeline.duration)).toMatchObject({ inputs: 7, value: 7, caption: 'done' });
    expect(getRateState(timeline, -1)).toEqual({ inputs: 0, dispatches: 0, value: null, caption: 'idle' });
  });
});

describe('loading discovery', () => {
  it('makes serial dependencies wait for the preceding resource', () => {
    const timeline = buildLoadingTimeline('serial');
    expect(timeline.tasks.map((task) => task.start)).toEqual([0, 300, 900, 1500]);
    expect(timeline.readyAt).toBe(2100);
    expect(getLoadingState(timeline, 900)).toEqual({ complete: 2, ready: false, caption: 'resources' });
  });

  it('overlaps resources known from the HTML rather than changing their duration', () => {
    const timeline = buildLoadingTimeline('parallel');
    expect(timeline.tasks.map((task) => task.start)).toEqual([0, 300, 300, 300]);
    expect(timeline.readyAt).toBe(900);
    expect(getLoadingState(timeline, 900)).toEqual({ complete: 4, ready: true, caption: 'ready' });
    expect(getLoadingState(timeline, -1)).toEqual({ complete: 0, ready: false, caption: 'idle' });
  });
});

describe('fixed-height list window', () => {
  it('bounds overscan at the start, in the middle and at the end', () => {
    expect(getListWindow(0)).toMatchObject({ first: 0, visibleEnd: 5, start: 0, end: 7 });
    expect(getListWindow(320)).toMatchObject({ first: 10, visibleEnd: 15, start: 8, end: 17 });
    expect(getListWindow(100_000)).toMatchObject({ first: 995, visibleEnd: 1000, start: 993, end: 1000 });
    expect(getListWindow(-10)).toEqual(getListWindow(0));
  });

  it('includes both partially visible edge rows and preserves the omitted geometry', () => {
    const window = getListWindow(17);
    expect(window).toMatchObject({ first: 0, visibleEnd: 6, start: 0, end: 8 });
    expect(window.top + (window.end - window.start) * 32 + window.bottom).toBe(32_000);
  });

  it('models bounded mounted rows while scrolling the same dataset in both modes', () => {
    expect(getListState('windowed', 2400)).toMatchObject({ first: 497, mounted: 9 });
    expect(getListState('full', 2400)).toMatchObject({ first: 497, mounted: 1000 });
    expect(getListState('windowed', LIST_TIMELINE.duration)).toMatchObject({ first: 995, mounted: 7 });
    expect(getListState('windowed', -400)).toMatchObject({ first: 0, mounted: 7 });
  });
});
