import { cn } from '@/lib/utils';

import type { Lane, RenderingTaskId, RenderingTimeline } from './rendering-timeline-model';

const VIEW = { width: 400, height: 132, axisStart: 72, axisEnd: 392 } as const;
const LANES: readonly Lane[] = ['server', 'network', 'browser'];
const LANE_Y: Record<Lane, number> = { server: 18, network: 50, browser: 82 };
const BAR_HEIGHT = 16;
const MIN_LABEL_WIDTH = 34;

const LANE_FILL: Record<Lane, string> = {
  server: 'fill-muted-foreground/45',
  network: 'fill-foreground/55',
  browser: 'fill-foreground/85',
};

type Props = {
  timeline: RenderingTimeline;
  time: number;
  label: string;
  laneLabels: Record<Lane, string>;
  taskLabel: (taskId: RenderingTaskId) => string;
  visibleLabel: string;
  interactiveLabel: string;
};

function toX(time: number, duration: number) {
  const ratio = Math.min(Math.max(time / duration, 0), 1);
  return VIEW.axisStart + ratio * (VIEW.axisEnd - VIEW.axisStart);
}

/** Server, network and browser work over the page load, drawn up to the current time. */
export function RenderingTimelineDiagram({
  timeline,
  time,
  label,
  laneLabels,
  taskLabel,
  visibleLabel,
  interactiveLabel,
}: Props) {
  const { duration, milestones } = timeline;
  const markerY = LANE_Y.browser + BAR_HEIGHT + 14;
  const markers =
    milestones.contentVisible === milestones.interactive
      ? [{ at: milestones.interactive, text: `${visibleLabel} + ${interactiveLabel}` }]
      : [
          { at: milestones.contentVisible, text: visibleLabel },
          { at: milestones.interactive, text: interactiveLabel },
        ];

  return (
    <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} role="img" aria-label={label} className="h-auto w-full">
      {LANES.map((lane) => (
        <g key={lane}>
          <text x={4} y={LANE_Y[lane] + 12} className="fill-muted-foreground text-[12px]">
            {laneLabels[lane]}
          </text>
          <line
            x1={VIEW.axisStart}
            y1={LANE_Y[lane] + BAR_HEIGHT / 2}
            x2={VIEW.axisEnd}
            y2={LANE_Y[lane] + BAR_HEIGHT / 2}
            className="stroke-border"
          />
        </g>
      ))}

      {timeline.tasks
        .filter((task) => task.start <= time)
        .map((task) => {
          const x = toX(task.start, duration);
          const width = toX(Math.min(task.end, time), duration) - x;
          const fullWidth = toX(task.end, duration) - x;
          return (
            <g key={task.id} data-task={task.id}>
              <rect
                x={x}
                y={LANE_Y[task.lane]}
                width={Math.max(width, 1)}
                height={BAR_HEIGHT}
                rx={3}
                className={LANE_FILL[task.lane]}
              />
              {fullWidth >= MIN_LABEL_WIDTH && time >= task.end && (
                <text
                  x={x + fullWidth / 2}
                  y={LANE_Y[task.lane] + 11.5}
                  textAnchor="middle"
                  className={cn('text-[11px]', task.lane === 'browser' ? 'fill-background' : 'fill-foreground')}
                >
                  {taskLabel(task.id)}
                </text>
              )}
            </g>
          );
        })}

      {markers
        .filter((marker) => marker.at <= time)
        .map((marker) => {
          const x = toX(marker.at, duration);
          return (
            <g key={marker.text} data-milestone={marker.text}>
              <line x1={x} y1={8} x2={x} y2={markerY - 8} strokeDasharray="3 2" className="stroke-foreground" />
              <text
                x={x}
                y={markerY}
                textAnchor={x > VIEW.axisEnd - 60 ? 'end' : 'middle'}
                className="fill-foreground text-[11px] font-medium"
              >
                {marker.text}
              </text>
            </g>
          );
        })}

      <line
        x1={toX(time, duration)}
        y1={4}
        x2={toX(time, duration)}
        y2={LANE_Y.browser + BAR_HEIGHT + 2}
        strokeDasharray="2 3"
        className={cn('stroke-ring', time < 0 && 'opacity-0')}
      />
    </svg>
  );
}
