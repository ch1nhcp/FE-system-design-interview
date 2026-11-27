/**
 * Pure model of one page load under each rendering strategy, on the same network and device.
 * Times are in ms from the navigation start; the numbers are illustrative, chosen so the differences are visible.
 */

export const RENDERING_MODES = ['csr', 'ssr', 'ssg', 'streaming'] as const;
export type RenderingMode = (typeof RENDERING_MODES)[number];

export type Lane = 'server' | 'network' | 'browser';

export type RenderingCaptionKey =
  | 'idle'
  | 'csrShell'
  | 'csrParse'
  | 'csrBundle'
  | 'csrExecute'
  | 'csrData'
  | 'csrRender'
  | 'csrInteractive'
  | 'ssrRender'
  | 'ssrHtml'
  | 'ssrPaint'
  | 'ssrBundle'
  | 'ssrHydrate'
  | 'ssrInteractive'
  | 'ssgHtml'
  | 'ssgPaint'
  | 'ssgBundle'
  | 'ssgHydrate'
  | 'ssgInteractive'
  | 'streamShell'
  | 'streamShellHtml'
  | 'streamPaint'
  | 'streamBundle'
  | 'streamHydrate'
  | 'streamInteractive'
  | 'streamRest'
  | 'streamRestPaint'
  | 'streamComplete';

export type RenderingTaskId =
  | 'shell'
  | 'parseShell'
  | 'bundle'
  | 'execute'
  | 'data'
  | 'render'
  | 'html'
  | 'paint'
  | 'hydrate'
  | 'query'
  | 'shellHtml'
  | 'rest'
  | 'restPaint';

export type RenderingTask = {
  readonly id: RenderingTaskId;
  readonly lane: Lane;
  readonly start: number;
  readonly end: number;
  /** Caption shown when the task starts; omitted when a task running in parallel already explains it. */
  readonly caption?: RenderingCaptionKey;
};

export type Milestones = {
  /** First meaningful content on screen. */
  readonly contentVisible: number;
  /** Event handlers attached: clicks and typing work. */
  readonly interactive: number;
  /** Every part of the page is on screen. */
  readonly complete: number;
};

type MilestoneCaptions = Partial<Record<keyof Milestones, RenderingCaptionKey>>;

export type RenderingTimeline = {
  readonly mode: RenderingMode;
  readonly duration: number;
  readonly tasks: readonly RenderingTask[];
  readonly milestones: Milestones;
  readonly javascriptKb: number;
  readonly stops: readonly number[];
  readonly events: readonly { readonly at: number; readonly caption: RenderingCaptionKey }[];
};

export type ScreenView = 'blank' | 'spinner' | 'partial' | 'content';
export type Screen = { readonly view: ScreenView; readonly interactive: boolean };

/** Same time axis for every mode, so they can be compared side by side. */
const DURATION = 1800;

type ModeDefinition = {
  tasks: RenderingTask[];
  milestones: Milestones;
  milestoneCaptions: MilestoneCaptions;
  javascriptKb: number;
  /** When the client-rendered shell starts showing a spinner. */
  spinnerFrom?: number;
};

const MODES: Record<RenderingMode, ModeDefinition> = {
  csr: {
    tasks: [
      { id: 'shell', lane: 'network', start: 0, end: 150, caption: 'csrShell' },
      { id: 'parseShell', lane: 'browser', start: 150, end: 200, caption: 'csrParse' },
      { id: 'bundle', lane: 'network', start: 200, end: 800, caption: 'csrBundle' },
      { id: 'execute', lane: 'browser', start: 800, end: 1000, caption: 'csrExecute' },
      { id: 'data', lane: 'network', start: 1000, end: 1400, caption: 'csrData' },
      { id: 'render', lane: 'browser', start: 1400, end: 1500, caption: 'csrRender' },
    ],
    milestones: { contentVisible: 1500, interactive: 1500, complete: 1500 },
    milestoneCaptions: { interactive: 'csrInteractive' },
    javascriptKb: 180,
    spinnerFrom: 200,
  },
  ssr: {
    tasks: [
      { id: 'render', lane: 'server', start: 0, end: 450, caption: 'ssrRender' },
      { id: 'html', lane: 'network', start: 450, end: 650, caption: 'ssrHtml' },
      { id: 'paint', lane: 'browser', start: 650, end: 700, caption: 'ssrPaint' },
      { id: 'bundle', lane: 'network', start: 700, end: 1300, caption: 'ssrBundle' },
      { id: 'hydrate', lane: 'browser', start: 1300, end: 1500, caption: 'ssrHydrate' },
    ],
    milestones: { contentVisible: 700, interactive: 1500, complete: 700 },
    milestoneCaptions: { interactive: 'ssrInteractive' },
    javascriptKb: 180,
  },
  ssg: {
    tasks: [
      { id: 'html', lane: 'network', start: 0, end: 150, caption: 'ssgHtml' },
      { id: 'paint', lane: 'browser', start: 150, end: 200, caption: 'ssgPaint' },
      { id: 'bundle', lane: 'network', start: 200, end: 800, caption: 'ssgBundle' },
      { id: 'hydrate', lane: 'browser', start: 800, end: 1000, caption: 'ssgHydrate' },
    ],
    milestones: { contentVisible: 200, interactive: 1000, complete: 200 },
    milestoneCaptions: { interactive: 'ssgInteractive' },
    javascriptKb: 180,
  },
  streaming: {
    tasks: [
      { id: 'shell', lane: 'server', start: 0, end: 100, caption: 'streamShell' },
      { id: 'query', lane: 'server', start: 100, end: 900 },
      { id: 'shellHtml', lane: 'network', start: 100, end: 250, caption: 'streamShellHtml' },
      { id: 'paint', lane: 'browser', start: 250, end: 300, caption: 'streamPaint' },
      { id: 'bundle', lane: 'network', start: 300, end: 550, caption: 'streamBundle' },
      { id: 'hydrate', lane: 'browser', start: 550, end: 650, caption: 'streamHydrate' },
      { id: 'rest', lane: 'network', start: 900, end: 1050, caption: 'streamRest' },
      { id: 'restPaint', lane: 'browser', start: 1050, end: 1100, caption: 'streamRestPaint' },
    ],
    milestones: { contentVisible: 300, interactive: 650, complete: 1100 },
    milestoneCaptions: { interactive: 'streamInteractive', complete: 'streamComplete' },
    javascriptKb: 40,
  },
};

export function buildRenderingTimeline(mode: RenderingMode): RenderingTimeline {
  const { tasks, milestones, milestoneCaptions, javascriptKb } = MODES[mode];

  const milestoneEvents = (Object.keys(milestoneCaptions) as (keyof Milestones)[]).flatMap((name) => {
    const caption = milestoneCaptions[name];
    return caption ? [{ at: milestones[name], caption }] : [];
  });
  const taskEvents = tasks.flatMap((task) => (task.caption ? [{ at: task.start, caption: task.caption }] : []));
  // Milestones first so that, at equal times, the task that starts wins as the caption.
  const events = [...milestoneEvents, ...taskEvents].sort((a, b) => a.at - b.at);

  const stops = [...new Set(tasks.flatMap((task) => [task.start, task.end]))].sort((a, b) => a - b);

  return { mode, duration: DURATION, tasks, milestones, javascriptKb, stops, events };
}

export function getScreenAt(timeline: RenderingTimeline, time: number): Screen {
  const { milestones } = timeline;
  const interactive = time >= milestones.interactive;
  const spinnerFrom = MODES[timeline.mode].spinnerFrom;

  if (time >= milestones.complete) {
    return { view: 'content', interactive };
  }
  if (time >= milestones.contentVisible) {
    return { view: 'partial', interactive };
  }
  if (spinnerFrom !== undefined && time >= spinnerFrom) {
    return { view: 'spinner', interactive };
  }
  return { view: 'blank', interactive };
}

export function getRenderingCaptionAt(timeline: RenderingTimeline, time: number): RenderingCaptionKey {
  return timeline.events.filter((event) => event.at <= time).at(-1)?.caption ?? 'idle';
}
