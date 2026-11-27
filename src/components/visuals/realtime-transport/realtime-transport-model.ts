/**
 * Pure model of the real-time transport animation.
 * Everything the animation shows is derived from a timeline and a point in time, so any frame can be rendered or tested.
 */
import { buildMessages } from './transport-messages';
import type { ServerUpdate, TransportConfig, TransportMessage, TransportMode } from './transport-messages';

export type { MessageKind, ServerUpdate, TransportConfig, TransportMessage, TransportMode } from './transport-messages';

export type CaptionKey =
  | 'idle'
  | 'serverUpdate'
  | 'pollRequest'
  | 'emptyResponse'
  | 'dataResponse'
  | 'longPollRequest'
  | 'longPollData'
  | 'longPollTimeout'
  | 'sseRequest'
  | 'sseOpen'
  | 'sseEvent'
  | 'sseEventArrives'
  | 'ssePost'
  | 'ssePostDone'
  | 'handshake'
  | 'handshakeAck'
  | 'push'
  | 'pushArrives'
  | 'clientMessage'
  | 'clientMessageArrives';

export type Caption = {
  readonly key: CaptionKey;
  readonly values: Readonly<Record<string, string | number>>;
};

type TimelineEvent = Caption & { readonly at: number };

export type TransportTimeline = {
  readonly mode: TransportMode;
  readonly duration: number;
  readonly updates: readonly ServerUpdate[];
  readonly messages: readonly TransportMessage[];
  readonly events: readonly TimelineEvent[];
  /** Sorted, unique times where something happens; used for step navigation. */
  readonly stops: readonly number[];
};

export type TransportStats = {
  /** HTTP requests the client made. Messages on an open connection do not count. */
  readonly requests: number;
  readonly wasted: number;
  readonly averageDelay: number | null;
};

export type Span = { readonly from: number; readonly to: number };
export type WaitingSpan = Span & { readonly updateId: number };

export const DEFAULT_TRANSPORT_CONFIG: TransportConfig = {
  duration: 9000,
  latency: 300,
  pollInterval: 2000,
  longPollTimeout: 2500,
  clientMessageAt: 7000,
  serverUpdates: [1200, 4700, 5300],
};

const HTTP_REQUEST_KINDS = new Set(['request', 'handshake', 'sideRequest']);

function formatUpdateIds(ids: readonly number[]): string {
  return ids.map((id) => `#${id}`).join(', ');
}

/** Delay of the update that waited longest among those a message delivers. */
function getDelay(message: TransportMessage, updates: readonly ServerUpdate[]): number {
  const readyTimes = updates.filter((update) => message.updateIds.includes(update.id)).map((update) => update.at);
  return message.arrivesAt - Math.min(...readyTimes);
}

function messageEvents(
  mode: TransportMode,
  message: TransportMessage,
  updates: readonly ServerUpdate[],
): TimelineEvent[] {
  const update = message.updateIds[0] ?? 0;
  const isStream = mode === 'serverSentEvents';
  const isLongPoll = mode === 'longPolling';

  switch (message.kind) {
    case 'request':
      if (isLongPoll && message.sentAt > 0) {
        // A long-poll client asks again the moment a response arrives; that response's caption says so.
        return [];
      }
      return [{ at: message.sentAt, key: isLongPoll ? 'longPollRequest' : 'pollRequest', values: {} }];
    case 'emptyResponse':
      return [{ at: message.arrivesAt, key: isLongPoll ? 'longPollTimeout' : 'emptyResponse', values: {} }];
    case 'dataResponse':
      return [
        {
          at: message.arrivesAt,
          key: isLongPoll ? 'longPollData' : 'dataResponse',
          values: { updates: formatUpdateIds(message.updateIds), delay: getDelay(message, updates) },
        },
      ];
    case 'handshake':
      return [{ at: message.sentAt, key: isStream ? 'sseRequest' : 'handshake', values: {} }];
    case 'handshakeAck':
      return [{ at: message.arrivesAt, key: isStream ? 'sseOpen' : 'handshakeAck', values: {} }];
    case 'push':
      return [
        { at: message.sentAt, key: isStream ? 'sseEvent' : 'push', values: { update } },
        {
          at: message.arrivesAt,
          key: isStream ? 'sseEventArrives' : 'pushArrives',
          values: { update, delay: getDelay(message, updates) },
        },
      ];
    case 'clientMessage':
      return [
        { at: message.sentAt, key: 'clientMessage', values: {} },
        { at: message.arrivesAt, key: 'clientMessageArrives', values: {} },
      ];
    case 'sideRequest':
      return [{ at: message.sentAt, key: 'ssePost', values: {} }];
    case 'sideResponse':
      return [{ at: message.arrivesAt, key: 'ssePostDone', values: {} }];
  }
}

export function buildTransportTimeline(
  mode: TransportMode,
  config: TransportConfig = DEFAULT_TRANSPORT_CONFIG,
): TransportTimeline {
  const updates = config.serverUpdates.map((at, index) => ({ id: index + 1, at }));
  const messages = buildMessages(mode, config, updates);

  // Server updates come first so that, at equal times, the message event wins as the caption.
  const updateEvents = updates.map(
    (update): TimelineEvent => ({
      at: update.at,
      key: 'serverUpdate',
      values: { update: update.id },
    }),
  );
  const events = [...updateEvents, ...messages.flatMap((message) => messageEvents(mode, message, updates))].sort(
    (a, b) => a.at - b.at,
  );

  const stopTimes = messages.flatMap((message) => [message.sentAt, message.arrivesAt]).concat(updates.map((u) => u.at));
  const stops = [...new Set(stopTimes)].sort((a, b) => a - b);

  return { mode, duration: config.duration, updates, messages, events, stops };
}

export function getStatsAt(timeline: TransportTimeline, time: number): TransportStats {
  const requests = timeline.messages.filter(
    (message) => HTTP_REQUEST_KINDS.has(message.kind) && message.sentAt <= time,
  ).length;
  const wasted = timeline.messages.filter(
    (message) => message.kind === 'emptyResponse' && message.arrivesAt <= time,
  ).length;

  const delays = timeline.messages
    .filter((message) => message.direction === 'toClient' && message.arrivesAt <= time)
    .flatMap((message) =>
      timeline.updates
        .filter((update) => message.updateIds.includes(update.id))
        .map((update) => message.arrivesAt - update.at),
    );
  const averageDelay =
    delays.length > 0 ? Math.round(delays.reduce((total, delay) => total + delay, 0) / delays.length) : null;

  return { requests, wasted, averageDelay };
}

export function getCaptionAt(timeline: TransportTimeline, time: number): Caption {
  const latest = timeline.events.filter((event) => event.at <= time).at(-1);
  return latest ? { key: latest.key, values: latest.values } : { key: 'idle', values: {} };
}

/** How long each ready update has been sitting on the server, up to `time` or until a message carries it away. */
export function getWaitingSpans(timeline: TransportTimeline, time: number): WaitingSpan[] {
  return timeline.updates
    .filter((update) => update.at <= time)
    .map((update) => {
      const carrier = timeline.messages.find((message) => message.updateIds.includes(update.id));
      const leavesAt = carrier?.sentAt ?? timeline.duration;
      return { updateId: update.id, from: update.at, to: Math.min(time, leavesAt) };
    });
}

/** Long polling only: how long the server keeps each request open before answering. */
export function getHoldSpans(timeline: TransportTimeline, time: number): Span[] {
  if (timeline.mode !== 'longPolling') {
    return [];
  }

  const requests = timeline.messages.filter((message) => message.kind === 'request');
  const responses = timeline.messages.filter((message) => message.direction === 'toClient');

  return requests
    .map((request, index) => ({
      from: request.arrivesAt,
      to: Math.min(time, responses[index]?.sentAt ?? timeline.duration),
    }))
    .filter((span) => span.from <= time && span.to > span.from);
}

/** SSE and WebSocket only: the long-lived connection, from the moment it opens until `time`. */
export function getConnectionSpan(timeline: TransportTimeline, time: number): Span | null {
  const ack = timeline.messages.find((message) => message.kind === 'handshakeAck');
  if (!ack || ack.arrivesAt > time) {
    return null;
  }
  return { from: ack.arrivesAt, to: time };
}
