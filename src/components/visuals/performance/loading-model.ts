export const LOADING_MODES = ['serial', 'parallel'] as const;
export type LoadingMode = (typeof LOADING_MODES)[number];
export type Resource = 'html' | 'javascript' | 'data' | 'image';

/** Same illustrative task durations; only resource discovery and dependency ordering change. */
export function buildLoadingTimeline(mode: LoadingMode) {
  const tasks: { resource: Resource; start: number; end: number }[] = [{ resource: 'html', start: 0, end: 300 }];
  for (const resource of ['javascript', 'data', 'image'] as const) {
    const start = mode === 'parallel' ? tasks[0]!.end : tasks.at(-1)!.end;
    tasks.push({ resource, start, end: start + 600 });
  }
  return {
    duration: 2400,
    tasks,
    readyAt: Math.max(...tasks.map((task) => task.end)),
    stops: [...new Set(tasks.flatMap((task) => [task.start, task.end]))].sort((a, b) => a - b),
  };
}

export function getLoadingState(timeline: ReturnType<typeof buildLoadingTimeline>, time: number) {
  const complete = timeline.tasks.filter((task) => task.end <= time).length;
  const ready = time >= timeline.readyAt;
  const caption = time < 0 ? 'idle' : ready ? 'ready' : time < timeline.tasks[0]!.end ? 'html' : 'resources';
  return { complete, ready, caption } as const;
}
