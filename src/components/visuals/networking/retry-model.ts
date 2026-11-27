/** Illustrative read requests: each client fails twice, then succeeds. All times are milliseconds. */
export const RETRY_MODES = ['immediate', 'backoff', 'jitter'] as const;
export type RetryMode = (typeof RETRY_MODES)[number];

export type Attempt = {
  readonly client: number;
  readonly number: number;
  readonly start: number;
  readonly end: number;
  readonly succeeds: boolean;
};

// Fixed samples make the jitter comparison reproducible when stepping or restarting.
const JITTER_SAMPLES = [
  [0.2, 0.7],
  [0.7, 0.2],
  [0.9, 0.9],
] as const;
const REQUEST_TIME = 400;
const BASE_DELAY = 600;
const CAP = 2400;

export function buildRetryTimeline(mode: RetryMode) {
  const attempts: Attempt[] = JITTER_SAMPLES.flatMap((samples, client) => {
    let start = 0;
    return [0, 1, 2].map((retry) => {
      if (retry > 0) {
        const ceiling = Math.min(CAP, BASE_DELAY * 2 ** (retry - 1));
        const delay = mode === 'immediate' ? 0 : mode === 'backoff' ? ceiling : ceiling * samples[retry - 1]!;
        start += REQUEST_TIME + delay;
      }
      return { client, number: retry + 1, start, end: start + REQUEST_TIME, succeeds: retry === 2 };
    });
  });
  return {
    duration: 3200,
    stops: [...new Set(attempts.flatMap((attempt) => [attempt.start, attempt.end]))].sort((a, b) => a - b),
    attempts,
  };
}

export function getRetryState(timeline: ReturnType<typeof buildRetryTimeline>, time: number) {
  const sent = timeline.attempts.filter((attempt) => time >= attempt.start).length;
  const recovered = timeline.attempts.filter((attempt) => attempt.succeeds && time >= attempt.end).length;
  const active = timeline.attempts.some((attempt) => time >= attempt.start && time < attempt.end);
  const caption =
    time < 0 ? 'idle' : recovered === 3 ? 'recovered' : time < REQUEST_TIME ? 'first' : active ? 'retrying' : 'waiting';
  return { sent, recovered, caption } as const;
}
