export const RATE_MODES = ['debounce', 'throttle'] as const;
export type RateMode = (typeof RATE_MODES)[number];

/** A sustained burst followed by one later input. Throttle is leading-only; debounce is trailing-only. */
const INPUTS = [0, 100, 200, 300, 400, 500, 1000].map((at, index) => ({ at, value: index + 1 }));
export const RATE_INTERVAL = 300;

export function buildRateTimeline(mode: RateMode) {
  let lastDispatch = -Infinity;
  const dispatches = INPUTS.flatMap((input, index) => {
    if (mode === 'debounce') {
      const at = input.at + RATE_INTERVAL;
      const next = INPUTS[index + 1];
      return !next || next.at > at ? [{ at, value: input.value }] : [];
    }
    if (input.at - lastDispatch < RATE_INTERVAL) return [];
    lastDispatch = input.at;
    return [input];
  });
  return {
    duration: 1700,
    inputs: INPUTS,
    dispatches,
    stops: [...new Set([...INPUTS, ...dispatches].map((event) => event.at))].sort((a, b) => a - b),
  };
}

export function getRateState(timeline: ReturnType<typeof buildRateTimeline>, time: number) {
  const inputs = timeline.inputs.filter((event) => event.at <= time);
  const dispatches = timeline.dispatches.filter((event) => event.at <= time);
  const lastDispatch = dispatches.at(-1);
  const caption =
    time < 0
      ? 'idle'
      : time >= timeline.dispatches.at(-1)!.at
        ? 'done'
        : lastDispatch && lastDispatch.at >= inputs.at(-1)!.at
          ? 'dispatch'
          : 'input';
  return { inputs: inputs.length, dispatches: dispatches.length, value: lastDispatch?.value ?? null, caption } as const;
}
