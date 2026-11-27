import { describe, expect, it } from 'vitest';

import {
  RENDERING_MODES,
  buildRenderingTimeline,
  getRenderingCaptionAt,
  getScreenAt,
} from './rendering-timeline-model';

describe('buildRenderingTimeline', () => {
  it('ships a blank shell first with client-side rendering, then fetches JS and data', () => {
    const timeline = buildRenderingTimeline('csr');

    expect(timeline.tasks.map((task) => [task.lane, task.id, task.start, task.end])).toEqual([
      ['network', 'shell', 0, 150],
      ['browser', 'parseShell', 150, 200],
      ['network', 'bundle', 200, 800],
      ['browser', 'execute', 800, 1000],
      ['network', 'data', 1000, 1400],
      ['browser', 'render', 1400, 1500],
    ]);
    expect(timeline.milestones).toEqual({ contentVisible: 1500, interactive: 1500, complete: 1500 });
    expect(timeline.javascriptKb).toBe(180);
  });

  it('shows content early with server-side rendering but is not interactive until hydration', () => {
    const timeline = buildRenderingTimeline('ssr');

    expect(timeline.milestones).toEqual({ contentVisible: 700, interactive: 1500, complete: 700 });
    expect(timeline.tasks[0]).toMatchObject({ lane: 'server', id: 'render', start: 0, end: 450 });
  });

  it('serves pre-built HTML from a CDN with static generation', () => {
    const timeline = buildRenderingTimeline('ssg');

    expect(timeline.milestones).toEqual({ contentVisible: 200, interactive: 1000, complete: 200 });
    expect(timeline.tasks.some((task) => task.lane === 'server')).toBe(false);
  });

  it('streams a shell first and the slow part later, with less JavaScript, using server components', () => {
    const timeline = buildRenderingTimeline('streaming');

    expect(timeline.milestones).toEqual({ contentVisible: 300, interactive: 650, complete: 1100 });
    expect(timeline.javascriptKb).toBeLessThan(buildRenderingTimeline('ssr').javascriptKb);
  });

  it('covers every mode with stops at each task boundary', () => {
    for (const mode of RENDERING_MODES) {
      const timeline = buildRenderingTimeline(mode);
      const boundaries = new Set(timeline.tasks.flatMap((task) => [task.start, task.end]));

      expect(timeline.stops).toEqual([...boundaries].sort((a, b) => a - b));
      expect(timeline.duration).toBeGreaterThanOrEqual(Math.max(...boundaries));
    }
  });
});

describe('getScreenAt', () => {
  it('goes from blank to a spinner to content with client-side rendering', () => {
    const timeline = buildRenderingTimeline('csr');

    expect(getScreenAt(timeline, -1)).toEqual({ view: 'blank', interactive: false });
    expect(getScreenAt(timeline, 300)).toEqual({ view: 'spinner', interactive: false });
    expect(getScreenAt(timeline, 1500)).toEqual({ view: 'content', interactive: true });
  });

  it('shows content that cannot respond yet before hydration', () => {
    const timeline = buildRenderingTimeline('ssr');

    expect(getScreenAt(timeline, 400)).toEqual({ view: 'blank', interactive: false });
    expect(getScreenAt(timeline, 800)).toEqual({ view: 'content', interactive: false });
    expect(getScreenAt(timeline, 1500)).toEqual({ view: 'content', interactive: true });
  });

  it('shows a partial page while the slow part streams in', () => {
    const timeline = buildRenderingTimeline('streaming');

    expect(getScreenAt(timeline, 700)).toEqual({ view: 'partial', interactive: true });
    expect(getScreenAt(timeline, 1100)).toEqual({ view: 'content', interactive: true });
  });
});

describe('getRenderingCaptionAt', () => {
  it('starts idle and then describes the task that just started or the milestone just reached', () => {
    const timeline = buildRenderingTimeline('ssr');

    expect(getRenderingCaptionAt(timeline, -1)).toBe('idle');
    expect(getRenderingCaptionAt(timeline, 0)).toBe('ssrRender');
    expect(getRenderingCaptionAt(timeline, 700)).toBe('ssrBundle');
    expect(getRenderingCaptionAt(timeline, 1500)).toBe('ssrInteractive');
  });
});
