import { cn } from '@/lib/utils';

import { getWaitingSpans } from './realtime-transport-model';
import type { MessageKind, TransportMessage, TransportTimeline } from './realtime-transport-model';

const VIEW = {
  width: 400,
  height: 160,
  axisStart: 64,
  axisEnd: 384,
  serverY: 36,
  clientY: 124,
} as const;

const CARRIES_DATA: ReadonlySet<MessageKind> = new Set(['dataResponse', 'push']);

type Props = {
  timeline: TransportTimeline;
  /** Current time on the timeline in ms; negative means nothing has happened yet. */
  time: number;
  label: string;
  serverLabel: string;
  clientLabel: string;
};

function toX(time: number, duration: number) {
  const ratio = Math.min(Math.max(time / duration, 0), 1);
  return VIEW.axisStart + ratio * (VIEW.axisEnd - VIEW.axisStart);
}

function rowY(direction: TransportMessage['direction'], end: 'from' | 'to') {
  const startsAtClient = direction === 'toServer';
  const atClient = end === 'from' ? startsAtClient : !startsAtClient;
  return atClient ? VIEW.clientY : VIEW.serverY;
}

function MessageArrow({ message, time, duration }: { message: TransportMessage; time: number; duration: number }) {
  if (time < message.sentAt) {
    return null;
  }

  const progress = Math.min((time - message.sentAt) / (message.arrivesAt - message.sentAt), 1);
  const x1 = toX(message.sentAt, duration);
  const y1 = rowY(message.direction, 'from');
  const x2 = toX(message.arrivesAt, duration);
  const y2 = rowY(message.direction, 'to');
  const endX = x1 + (x2 - x1) * progress;
  const endY = y1 + (y2 - y1) * progress;

  const carriesData = CARRIES_DATA.has(message.kind);
  const isEmpty = message.kind === 'emptyResponse';

  return (
    <g data-message-kind={message.kind}>
      <line
        x1={x1}
        y1={y1}
        x2={endX}
        y2={endY}
        strokeWidth={carriesData ? 2 : 1.25}
        strokeDasharray={isEmpty ? '4 3' : undefined}
        className={carriesData ? 'stroke-foreground' : 'stroke-muted-foreground'}
      />
      <circle
        cx={endX}
        cy={endY}
        r={progress < 1 ? 3.5 : 2}
        className={carriesData ? 'fill-foreground' : 'fill-muted-foreground'}
      />
    </g>
  );
}

/** Sequence diagram of client/server messages, rendered for a single point in time. */
export function RealtimeTransportDiagram({ timeline, time, label, serverLabel, clientLabel }: Props) {
  const { duration } = timeline;
  const playheadX = toX(time, duration);

  return (
    <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} role="img" aria-label={label} className="h-auto w-full">
      <g className="fill-muted-foreground text-[12px]">
        <text x={4} y={VIEW.serverY + 4} className="text-[14px]">
          {serverLabel}
        </text>
        <text x={4} y={VIEW.clientY + 4} className="text-[14px]">
          {clientLabel}
        </text>
        <text x={VIEW.axisStart} y={VIEW.height - 8}>
          0s
        </text>
        <text x={VIEW.axisEnd} y={VIEW.height - 8} textAnchor="end">
          {duration / 1000}s
        </text>
      </g>

      <g className="stroke-border" strokeWidth={1}>
        <line x1={VIEW.axisStart} y1={VIEW.serverY} x2={VIEW.axisEnd} y2={VIEW.serverY} />
        <line x1={VIEW.axisStart} y1={VIEW.clientY} x2={VIEW.axisEnd} y2={VIEW.clientY} />
      </g>

      {getWaitingSpans(timeline, time).map((span) => (
        <line
          key={span.updateId}
          data-waiting-span={span.updateId}
          x1={toX(span.from, duration)}
          y1={VIEW.serverY}
          x2={toX(span.to, duration)}
          y2={VIEW.serverY}
          strokeWidth={6}
          strokeLinecap="round"
          className="stroke-foreground/20"
        />
      ))}

      {timeline.updates
        .filter((update) => update.at <= time)
        .map((update) => {
          const x = toX(update.at, duration);
          return (
            <g key={update.id} className="fill-foreground" data-server-update={update.id}>
              <rect x={x - 4} y={VIEW.serverY - 4} width={8} height={8} transform={`rotate(45 ${x} ${VIEW.serverY})`} />
              <text x={x} y={VIEW.serverY - 12} textAnchor="middle" className="text-[12px]">
                #{update.id}
              </text>
            </g>
          );
        })}

      {timeline.messages.map((message) => (
        <MessageArrow key={message.id} message={message} time={time} duration={duration} />
      ))}

      <line
        x1={playheadX}
        y1={VIEW.serverY - 28}
        x2={playheadX}
        y2={VIEW.clientY + 20}
        strokeDasharray="2 3"
        className={cn('stroke-ring', time < 0 && 'opacity-0')}
      />
    </svg>
  );
}
