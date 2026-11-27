export const LIST_MODES = ['full', 'windowed'] as const;
export type ListMode = (typeof LIST_MODES)[number];
export const LIST_GEOMETRY = { count: 1000, rowHeight: 32, viewportHeight: 160, overscan: 2 } as const;
export const LIST_TIMELINE = { duration: 4800, stops: [0, 1200, 2400, 3600, 4800] } as const;

/** Fixed-height rows with an exclusive end index, including partial rows for arbitrary scroll offsets. */
export function getListWindow(scrollTop: number) {
  const { count, rowHeight, viewportHeight, overscan } = LIST_GEOMETRY;
  const offset = Math.min(Math.max(scrollTop, 0), count * rowHeight - viewportHeight);
  const first = Math.floor(offset / rowHeight);
  const visibleEnd = Math.min(count, Math.ceil((offset + viewportHeight) / rowHeight));
  const start = Math.max(0, first - overscan);
  const end = Math.min(count, visibleEnd + overscan);
  return { first, visibleEnd, start, end, top: start * rowHeight, bottom: (count - end) * rowHeight };
}

export function getListState(mode: ListMode, time: number) {
  const { count, rowHeight, viewportHeight } = LIST_GEOMETRY;
  const progress = Math.min(Math.max(time / LIST_TIMELINE.duration, 0), 1);
  // Whole-row steps keep the animated viewport labels readable.
  const scrollTop = Math.floor(progress * (count - viewportHeight / rowHeight)) * rowHeight;
  const window = getListWindow(scrollTop);
  return { ...window, mounted: mode === 'full' ? count : window.end - window.start, scrollTop };
}
