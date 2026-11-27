/**
 * Message schedules for each real-time transport, given the same server updates and network latency.
 * Times are in ms from the start of the timeline.
 */

export type TransportMode = 'shortPolling' | 'longPolling' | 'serverSentEvents' | 'webSocket';

export type MessageKind =
  /** HTTP request that asks for updates (polling and long polling). */
  | 'request'
  | 'emptyResponse'
  | 'dataResponse'
  /** Request that opens a long-lived connection: a WebSocket upgrade or an EventSource request. */
  | 'handshake'
  | 'handshakeAck'
  /** Server to client message on an open connection. */
  | 'push'
  /** Client to server message on an open WebSocket. */
  | 'clientMessage'
  /** Separate HTTP request the client needs to send data when it only has an event stream. */
  | 'sideRequest'
  | 'sideResponse';

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

export type TransportConfig = {
  readonly duration: number;
  /** One-way network latency. */
  readonly latency: number;
  readonly pollInterval: number;
  /** How long the server holds a long-poll request before answering with no news. */
  readonly longPollTimeout: number;
  /** When the client sends data, to contrast WebSocket frames with a separate request next to SSE. */
  readonly clientMessageAt: number;
  /** Times at which new data becomes available on the server. */
  readonly serverUpdates: readonly number[];
};

function message(
  id: string,
  kind: MessageKind,
  sentAt: number,
  latency: number,
  updateIds: readonly number[] = [],
): TransportMessage {
  const direction = ['request', 'handshake', 'clientMessage', 'sideRequest'].includes(kind) ? 'toServer' : 'toClient';
  return { id, kind, direction, sentAt, arrivesAt: sentAt + latency, updateIds };
}

function readyBy(updates: readonly ServerUpdate[], delivered: number, time: number): number[] {
  return updates.filter((update) => update.id > delivered && update.at <= time).map((update) => update.id);
}

function shortPolling(config: TransportConfig, updates: readonly ServerUpdate[]): TransportMessage[] {
  const messages: TransportMessage[] = [];
  let delivered = 0;

  for (let sentAt = 0; sentAt + 2 * config.latency <= config.duration; sentAt += config.pollInterval) {
    const serverSeesAt = sentAt + config.latency;
    const updateIds = readyBy(updates, delivered, serverSeesAt);
    delivered = updateIds.at(-1) ?? delivered;
    const kind = updateIds.length > 0 ? 'dataResponse' : 'emptyResponse';

    messages.push(
      message(`request-${sentAt}`, 'request', sentAt, config.latency),
      message(`response-${sentAt}`, kind, serverSeesAt, config.latency, updateIds),
    );
  }

  return messages;
}

function longPolling(config: TransportConfig, updates: readonly ServerUpdate[]): TransportMessage[] {
  const messages: TransportMessage[] = [];
  let delivered = 0;
  let sentAt = 0;

  while (sentAt + config.latency <= config.duration) {
    const serverSeesAt = sentAt + config.latency;
    const next = updates.find((update) => update.id > delivered);
    const respondAt =
      next && next.at <= serverSeesAt + config.longPollTimeout
        ? Math.max(next.at, serverSeesAt)
        : serverSeesAt + config.longPollTimeout;

    messages.push(message(`request-${sentAt}`, 'request', sentAt, config.latency));
    if (respondAt + config.latency > config.duration) {
      break;
    }

    const updateIds = readyBy(updates, delivered, respondAt);
    delivered = updateIds.at(-1) ?? delivered;
    const kind = updateIds.length > 0 ? 'dataResponse' : 'emptyResponse';
    messages.push(message(`response-${sentAt}`, kind, respondAt, config.latency, updateIds));

    // The client asks again as soon as the response arrives.
    sentAt = respondAt + config.latency;
  }

  return messages;
}

function persistentConnection(
  config: TransportConfig,
  updates: readonly ServerUpdate[],
  mode: 'serverSentEvents' | 'webSocket',
): TransportMessage[] {
  const openAt = 2 * config.latency;
  const pushes = updates.map((update) =>
    message(`push-${update.id}`, 'push', Math.max(update.at, openAt), config.latency, [update.id]),
  );
  const clientSends =
    mode === 'webSocket'
      ? [message('client-message', 'clientMessage', config.clientMessageAt, config.latency)]
      : [
          message('side-request', 'sideRequest', config.clientMessageAt, config.latency),
          message('side-response', 'sideResponse', config.clientMessageAt + config.latency, config.latency),
        ];

  return [
    message('handshake', 'handshake', 0, config.latency),
    message('handshake-ack', 'handshakeAck', config.latency, config.latency),
    ...pushes,
    ...clientSends,
  ];
}

export function buildMessages(
  mode: TransportMode,
  config: TransportConfig,
  updates: readonly ServerUpdate[],
): TransportMessage[] {
  switch (mode) {
    case 'shortPolling':
      return shortPolling(config, updates);
    case 'longPolling':
      return longPolling(config, updates);
    case 'serverSentEvents':
    case 'webSocket':
      return persistentConnection(config, updates, mode);
  }
}
