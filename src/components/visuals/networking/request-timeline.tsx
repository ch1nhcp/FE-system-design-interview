import { cn } from '@/lib/utils';

export type RequestLane = {
  label: string;
  requests: readonly { start: number; end: number; label: string; outcome: string }[];
};

type Props = { lanes: readonly RequestLane[]; duration: number; time: number; label: string; timeLabel: string };

/** Request bars grow with elapsed time; completed bars show a textual outcome, not only a color. */
export function RequestTimeline({ lanes, duration, time, label, timeLabel }: Props) {
  const toX = (at: number) => 76 + (Math.min(Math.max(at, 0), duration) / duration) * 276;
  const axisY = 26 + lanes.length * 40;
  return (
    <svg viewBox={`0 0 360 ${axisY + 24}`} role="img" aria-label={label} className="h-auto w-full">
      {lanes.map((lane, index) => {
        const y = 16 + index * 40;
        return (
          <g key={lane.label}>
            <text x={0} y={y + 14} className="fill-muted-foreground text-[11px]">
              {lane.label}
            </text>
            <line x1={76} x2={352} y1={y + 10} y2={y + 10} className="stroke-border" />
            {lane.requests
              .filter((request) => request.start <= time)
              .map((request) => (
                <g key={request.start}>
                  <title>{request.label}</title>
                  <rect
                    x={toX(request.start)}
                    y={y}
                    width={Math.max(1, toX(Math.min(time, request.end)) - toX(request.start))}
                    height={22}
                    rx={3}
                    className="fill-muted stroke-foreground/60"
                  />
                  {time >= request.end && (
                    <text
                      x={(toX(request.start) + toX(request.end)) / 2}
                      y={y + 15}
                      textAnchor="middle"
                      className="fill-foreground text-[11px] font-medium"
                    >
                      {request.outcome}
                    </text>
                  )}
                </g>
              ))}
          </g>
        );
      })}
      <line x1={76} x2={352} y1={axisY} y2={axisY} className="stroke-border" />
      <text x={76} y={axisY + 16} className="fill-muted-foreground text-[10px]">
        0
      </text>
      <text x={352} y={axisY + 16} textAnchor="end" className="fill-muted-foreground text-[10px]">
        {timeLabel}
      </text>
      <line
        x1={toX(time)}
        x2={toX(time)}
        y1={4}
        y2={axisY}
        strokeDasharray="3 3"
        className={cn('stroke-foreground', time < 0 && 'opacity-0')}
      />
    </svg>
  );
}
