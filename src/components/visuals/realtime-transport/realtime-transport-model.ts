/**
 * Pure model of the "short polling vs WebSocket" animation.
 * Everything the animation shows is derived from a timeline and a point in time, so any frame can be rendered or tested.
 */

export type TransportMode = 'shortPolling' | 'webSocket';

export type MessageKind = 'request' | 'emptyResponse' | 'dataResponse' | 'handshake' | 'handshakeAck' | 'push';

export type TransportMessage = {
  readonly id: string;
  readonly kind: MessageKind;
  readonly direction: 'toServer' | 'toClient';
  readonly sentAt: number;
  readonly arrivesAt: number;
  /** 1-based ids of the server updates this message delivers. */
  readonly updateIds: readonly number[];
};

export type ServerUpdate = {
  readonly id: number;
  readonly at: number;
};

export type CaptionKey =
  | 'idle'
  | 'serverUpdate'
  | 'pollRequest'
  | 'emptyResponse'
  | 'dataResponse'
  | 'handshake'
  | 'handshakeAck'
  | 'push'
  | 'pushArrives';

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

export type TransportConfig = {
  readonly duration: number;
  /** One-way network latency in ms. */
  readonly latency: number;
  readonly pollInterval: number;
  /** Times at which new data becomes available on the server. */
  readonly serverUpdates: readonly number[];
};

export type TransportStats = {
  readonly requests: number;
  readonly wasted: number;
  readonly averageDelay: number | null;
};

export const DEFAULT_TRANSPORT_CONFIG: TransportConfig = {
  duration: 9000,
  latency: 300,
  pollInterval: 2000,
  serverUpdates: [1200, 4700, 5300],
};

function toUpdates(config: TransportConfig): ServerUpdate[] {
  return config.serverUpdates.map((at, index) => ({ id: index + 1, at }));
}

function buildShortPollingMessages(config: TransportConfig, updates: readonly ServerUpdate[]): TransportMessage[] {
  const messages: TransportMessage[] = [];
  let delivered = 0;

  for (let sentAt = 0; sentAt + 2 * config.latency <= config.duration; sentAt += config.pollInterval) {
    const serverSeesAt = sentAt + config.latency;
    const ready = updates.filter((update) => update.id > delivered && update.at <= serverSeesAt);
    const updateIds = ready.map((update) => update.id);
    delivered = updateIds.at(-1) ?? delivered;

    messages.push(
      {
        id: `request-${sentAt}`,
        kind: 'request',
        direction: 'toServer',
        sentAt,
        arrivesAt: serverSeesAt,
        updateIds: [],
      },
      {
        id: `response-${sentAt}`,
        kind: updateIds.length > 0 ? 'dataResponse' : 'emptyResponse',
        direction: 'toClient',
        sentAt: serverSeesAt,
        arrivesAt: serverSeesAt + config.latency,
        updateIds,
      },
    );
  }

  return messages;
}

function buildWebSocketMessages(config: TransportConfig, updates: readonly ServerUpdate[]): TransportMessage[] {
  const openAt = 2 * config.latency;
  const handshake: TransportMessage[] = [
    { id: 'handshake', kind: 'handshake', direction: 'toServer', sentAt: 0, arrivesAt: config.latency, updateIds: [] },
    {
      id: 'handshake-ack',
      kind: 'handshakeAck',
      direction: 'toClient',
      sentAt: config.latency,
      arrivesAt: openAt,
      updateIds: [],
    },
  ];

  const pushes = updates.map((update): TransportMessage => {
    const sentAt = Math.max(update.at, openAt);
    return {
      id: `push-${update.id}`,
      kind: 'push',
      direction: 'toClient',
      sentAt,
      arrivesAt: sentAt + config.latency,
      updateIds: [update.id],
    };
  });

  return [...handshake, ...pushes];
}

function formatUpdateIds(ids: readonly number[]): string {
  return ids.map((id) => `#${id}`).join(', ');
}

function getDelay(message: TransportMessage, updates: readonly ServerUpdate[]): number {
  const readyTimes = updates.filter((update) => message.updateIds.includes(update.id)).map((update) => update.at);
  return message.arrivesAt - Math.min(...readyTimes);
}

function messageEvents(message: TransportMessage, updates: readonly ServerUpdate[]): TimelineEvent[] {
  const firstUpdate = message.updateIds[0] ?? 0;

  switch (message.kind) {
    case 'request':
      return [{ at: message.sentAt, key: 'pollRequest', values: {} }];
    case 'emptyResponse':
      return [{ at: message.arrivesAt, key: 'emptyResponse', values: {} }];
    case 'dataResponse':
      return [
        {
          at: message.arrivesAt,
          key: 'dataResponse',
          values: { updates: formatUpdateIds(message.updateIds), delay: getDelay(message, updates) },
        },
      ];
    case 'handshake':
      return [{ at: message.sentAt, key: 'handshake', values: {} }];
    case 'handshakeAck':
      return [{ at: message.arrivesAt, key: 'handshakeAck', values: {} }];
    case 'push':
      return [
        { at: message.sentAt, key: 'push', values: { update: firstUpdate } },
        {
          at: message.arrivesAt,
          key: 'pushArrives',
          values: { update: firstUpdate, delay: getDelay(message, updates) },
        },
      ];
  }
}

export function buildTransportTimeline(
  mode: TransportMode,
  config: TransportConfig = DEFAULT_TRANSPORT_CONFIG,
): TransportTimeline {
  const updates = toUpdates(config);
  const messages =
    mode === 'shortPolling' ? buildShortPollingMessages(config, updates) : buildWebSocketMessages(config, updates);

  // Server updates come first so that, at equal times, the message event wins as the caption.
  const updateEvents = updates.map(
    (update): TimelineEvent => ({
      at: update.at,
      key: 'serverUpdate',
      values: { update: update.id },
    }),
  );
  const events = [...updateEvents, ...messages.flatMap((message) => messageEvents(message, updates))].sort(
    (a, b) => a.at - b.at,
  );

  const stopTimes = messages.flatMap((message) => [message.sentAt, message.arrivesAt]).concat(updates.map((u) => u.at));
  const stops = [...new Set(stopTimes)].sort((a, b) => a - b);

  return { mode, duration: config.duration, updates, messages, events, stops };
}

export function getStatsAt(timeline: TransportTimeline, time: number): TransportStats {
  const requests = timeline.messages.filter(
    (message) => (message.kind === 'request' || message.kind === 'handshake') && message.sentAt <= time,
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

export type WaitingSpan = {
  readonly updateId: number;
  readonly from: number;
  readonly to: number;
};

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
