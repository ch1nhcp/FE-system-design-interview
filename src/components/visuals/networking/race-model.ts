export const RACE_MODES = ['unguarded', 'latest'] as const;
export type RaceMode = (typeof RACE_MODES)[number];

const REQUESTS = [
  { term: 'r', start: 0, end: 2000 },
  { term: 'react', start: 400, end: 1000 },
] as const;
export type SearchTerm = 'empty' | (typeof REQUESTS)[number]['term'];

/** Two reads return out of order; the old request deliberately remains in flight in both modes. */
export const RACE_TIMELINE = {
  duration: 2400,
  stops: [...new Set(REQUESTS.flatMap((request) => [request.start, request.end]))].sort((a, b) => a - b),
  requests: REQUESTS,
} as const;

export function getRaceState(mode: RaceMode, time: number) {
  const [older, newer] = RACE_TIMELINE.requests;
  const query: SearchTerm = time < older.start ? 'empty' : time < newer.start ? older.term : newer.term;
  const result: SearchTerm =
    time < newer.end ? 'empty' : time < older.end || mode === 'latest' ? newer.term : older.term;
  const caption =
    time < older.start
      ? 'idle'
      : time < newer.start
        ? 'first'
        : time < newer.end
          ? 'second'
          : time < older.end
            ? 'newResult'
            : mode === 'latest'
              ? 'ignored'
              : 'stale';
  return { query, result, caption, ignored: mode === 'latest' && time >= older.end ? 1 : 0 } as const;
}
