import { describe, expect, it } from 'vitest';

import { RACE_TIMELINE, getRaceState } from './race-model';
import { RETRY_MODES, buildRetryTimeline, getRetryState } from './retry-model';

describe('retry scheduling', () => {
  it('spaces deterministic backoff attempts while keeping clients synchronized', () => {
    const timeline = buildRetryTimeline('backoff');
    expect(timeline.attempts.filter((attempt) => attempt.client === 0).map((attempt) => attempt.start)).toEqual([
      0, 1000, 2600,
    ]);
    expect(timeline.attempts.filter((attempt) => attempt.number === 2).map((attempt) => attempt.start)).toEqual([
      1000, 1000, 1000,
    ]);
    expect(getRetryState(timeline, 500)).toMatchObject({ sent: 3, recovered: 0, caption: 'waiting' });
  });

  it('uses reproducible full-jitter samples to spread clients across a backoff window', () => {
    const timeline = buildRetryTimeline('jitter');
    expect(timeline.attempts.filter((attempt) => attempt.client === 0).map((attempt) => attempt.start)).toEqual([
      0, 520, 1760,
    ]);
    expect(timeline.attempts.filter((attempt) => attempt.number === 2).map((attempt) => attempt.start)).toEqual([
      520, 820, 940,
    ]);
    expect(buildRetryTimeline('jitter')).toEqual(timeline);
  });

  it('immediate retries add no waiting after a failed request', () => {
    const timeline = buildRetryTimeline('immediate');
    expect(timeline.attempts.filter((attempt) => attempt.client === 0).map((attempt) => attempt.start)).toEqual([
      0, 400, 800,
    ]);
    expect(getRetryState(timeline, 800)).toMatchObject({ sent: 9, recovered: 0, caption: 'retrying' });
  });

  it.each(RETRY_MODES)('steps through every boundary and ends recovered in %s mode', (mode) => {
    const timeline = buildRetryTimeline(mode);
    expect(getRetryState(timeline, -1)).toEqual({ sent: 0, recovered: 0, caption: 'idle' });
    for (const attempt of timeline.attempts) {
      expect(timeline.stops).toContain(attempt.start);
      expect(timeline.stops).toContain(attempt.end);
      expect(attempt.end).toBeLessThanOrEqual(timeline.duration);
    }
    expect(getRetryState(timeline, timeline.duration)).toEqual({ sent: 9, recovered: 3, caption: 'recovered' });
  });
});

describe('out-of-order search', () => {
  it('demonstrates an old response overwriting results for the current input', () => {
    expect(getRaceState('unguarded', 1000)).toMatchObject({ query: 'react', result: 'react', caption: 'newResult' });
    expect(getRaceState('unguarded', 2000)).toMatchObject({ query: 'react', result: 'r', caption: 'stale' });
  });

  it('keeps the current result when the older request finishes under a generation guard', () => {
    expect(getRaceState('latest', 1000)).toMatchObject({ result: 'react', ignored: 0 });
    expect(getRaceState('latest', 2000)).toEqual({ query: 'react', result: 'react', caption: 'ignored', ignored: 1 });
  });

  it('derives earlier frames without retaining state from a later completion', () => {
    getRaceState('latest', RACE_TIMELINE.duration);
    expect(getRaceState('latest', 500)).toMatchObject({ query: 'react', result: 'empty', ignored: 0 });
    expect(getRaceState('latest', -1)).toMatchObject({ query: 'empty', result: 'empty', caption: 'idle' });
  });
});
