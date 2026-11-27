import { describe, expect, it } from 'vitest';

import {
  buildTransportTimeline,
  getCaptionAt,
  getConnectionSpan,
  getHoldSpans,
  getStatsAt,
  getWaitingSpans,
} from './realtime-transport-model';
import type { TransportConfig, TransportTimeline } from './realtime-transport-model';

const config: TransportConfig = {
  duration: 9000,
  latency: 300,
  pollInterval: 2000,
  longPollTimeout: 2500,
  clientMessageAt: 7000,
  serverUpdates: [1200, 4700, 5300],
};

function summarize(timeline: TransportTimeline) {
  return timeline.messages.map((message) => [message.kind, message.sentAt, message.arrivesAt, message.updateIds]);
}

describe('short polling', () => {
  const timeline = buildTransportTimeline('shortPolling', config);

  it('polls on a fixed interval and answers each request with or without data', () => {
    expect(summarize(timeline)).toEqual([
      ['request', 0, 300, []],
      ['emptyResponse', 300, 600, []],
      ['request', 2000, 2300, []],
      ['dataResponse', 2300, 2600, [1]],
      ['request', 4000, 4300, []],
      ['emptyResponse', 4300, 4600, []],
      ['request', 6000, 6300, []],
      ['dataResponse', 6300, 6600, [2, 3]],
      ['request', 8000, 8300, []],
      ['emptyResponse', 8300, 8600, []],
    ]);
  });

  it('counts requests, wasted round trips and the delay of delivered updates', () => {
    expect(getStatsAt(timeline, 0)).toEqual({ requests: 1, wasted: 0, averageDelay: null });
    expect(getStatsAt(timeline, 2600)).toEqual({ requests: 2, wasted: 1, averageDelay: 1400 });
    expect(getStatsAt(timeline, config.duration)).toEqual({ requests: 5, wasted: 3, averageDelay: 1533 });
  });

  it('describes the latest event at a given time', () => {
    expect(getCaptionAt(timeline, -1)).toEqual({ key: 'idle', values: {} });
    expect(getCaptionAt(timeline, 0)).toEqual({ key: 'pollRequest', values: {} });
    expect(getCaptionAt(timeline, 600)).toEqual({ key: 'emptyResponse', values: {} });
    expect(getCaptionAt(timeline, 1200)).toEqual({ key: 'serverUpdate', values: { update: 1 } });
    expect(getCaptionAt(timeline, 2600)).toEqual({ key: 'dataResponse', values: { updates: '#1', delay: 1400 } });
    expect(getCaptionAt(timeline, 6600)).toEqual({ key: 'dataResponse', values: { updates: '#2, #3', delay: 1900 } });
  });

  it('shows updates waiting on the server until a poll picks them up', () => {
    expect(getWaitingSpans(timeline, 1000)).toEqual([]);
    expect(getWaitingSpans(timeline, 1800)).toEqual([{ updateId: 1, from: 1200, to: 1800 }]);
    expect(getWaitingSpans(timeline, 3000)).toEqual([{ updateId: 1, from: 1200, to: 2300 }]);
  });

  it('never holds requests or keeps a connection open', () => {
    expect(getHoldSpans(timeline, config.duration)).toEqual([]);
    expect(getConnectionSpan(timeline, config.duration)).toBeNull();
  });
});

describe('long polling', () => {
  const timeline = buildTransportTimeline('longPolling', config);

  it('holds each request until an update is ready or the timeout passes, then asks again', () => {
    expect(summarize(timeline)).toEqual([
      ['request', 0, 300, []],
      ['dataResponse', 1200, 1500, [1]],
      ['request', 1500, 1800, []],
      ['emptyResponse', 4300, 4600, []],
      ['request', 4600, 4900, []],
      ['dataResponse', 4900, 5200, [2]],
      ['request', 5200, 5500, []],
      ['dataResponse', 5500, 5800, [3]],
      ['request', 5800, 6100, []],
      ['emptyResponse', 8600, 8900, []],
    ]);
  });

  it('delivers updates much sooner than short polling with fewer wasted round trips', () => {
    expect(getStatsAt(timeline, config.duration)).toEqual({ requests: 5, wasted: 2, averageDelay: 433 });
  });

  it('shows how long the server holds each request', () => {
    expect(getHoldSpans(timeline, 2000)).toEqual([
      { from: 300, to: 1200 },
      { from: 1800, to: 2000 },
    ]);
    expect(getHoldSpans(timeline, config.duration)).toEqual([
      { from: 300, to: 1200 },
      { from: 1800, to: 4300 },
      { from: 6100, to: 8600 },
    ]);
  });

  it('uses captions that explain holding and timeouts', () => {
    expect(getCaptionAt(timeline, 0)).toEqual({ key: 'longPollRequest', values: {} });
    expect(getCaptionAt(timeline, 1500)).toEqual({ key: 'longPollData', values: { updates: '#1', delay: 300 } });
    expect(getCaptionAt(timeline, 4600)).toEqual({ key: 'longPollTimeout', values: {} });
  });
});

describe('server-sent events', () => {
  const timeline = buildTransportTimeline('serverSentEvents', config);

  it('opens one stream, sends events down it and uses a separate request to send data', () => {
    expect(summarize(timeline)).toEqual([
      ['handshake', 0, 300, []],
      ['handshakeAck', 300, 600, []],
      ['push', 1200, 1500, [1]],
      ['push', 4700, 5000, [2]],
      ['push', 5300, 5600, [3]],
      ['sideRequest', 7000, 7300, []],
      ['sideResponse', 7300, 7600, []],
    ]);
  });

  it('counts the stream and the separate request as HTTP requests', () => {
    expect(getStatsAt(timeline, config.duration)).toEqual({ requests: 2, wasted: 0, averageDelay: 300 });
  });

  it('keeps the connection open from the moment the stream opens', () => {
    expect(getConnectionSpan(timeline, 500)).toBeNull();
    expect(getConnectionSpan(timeline, 2000)).toEqual({ from: 600, to: 2000 });
  });

  it('uses captions specific to event streams', () => {
    expect(getCaptionAt(timeline, 0)).toEqual({ key: 'sseRequest', values: {} });
    expect(getCaptionAt(timeline, 600)).toEqual({ key: 'sseOpen', values: {} });
    expect(getCaptionAt(timeline, 1200)).toEqual({ key: 'sseEvent', values: { update: 1 } });
    expect(getCaptionAt(timeline, 1500)).toEqual({ key: 'sseEventArrives', values: { update: 1, delay: 300 } });
    expect(getCaptionAt(timeline, 7000)).toEqual({ key: 'ssePost', values: {} });
    expect(getCaptionAt(timeline, 7600)).toEqual({ key: 'ssePostDone', values: {} });
  });
});

describe('WebSocket', () => {
  const timeline = buildTransportTimeline('webSocket', config);

  it('upgrades once, pushes every update as soon as it is ready and lets the client send on the same connection', () => {
    expect(summarize(timeline)).toEqual([
      ['handshake', 0, 300, []],
      ['handshakeAck', 300, 600, []],
      ['push', 1200, 1500, [1]],
      ['push', 4700, 5000, [2]],
      ['push', 5300, 5600, [3]],
      ['clientMessage', 7000, 7300, []],
    ]);
  });

  it('waits for the connection before pushing an update that is ready earlier', () => {
    const early = buildTransportTimeline('webSocket', { ...config, serverUpdates: [100] });

    expect(early.messages.find((message) => message.kind === 'push')).toMatchObject({
      sentAt: 600,
      arrivesAt: 900,
      updateIds: [1],
    });
  });

  it('needs a single HTTP request and delivers with one-way latency', () => {
    expect(getStatsAt(timeline, config.duration)).toEqual({ requests: 1, wasted: 0, averageDelay: 300 });
    expect(getWaitingSpans(timeline, 2000)).toEqual([{ updateId: 1, from: 1200, to: 1200 }]);
  });

  it('exposes sorted, unique step stops covering every event', () => {
    expect(timeline.stops).toEqual([0, 300, 600, 1200, 1500, 4700, 5000, 5300, 5600, 7000, 7300]);
  });

  it('uses captions for the handshake, pushes and client messages', () => {
    expect(getCaptionAt(timeline, 600)).toEqual({ key: 'handshakeAck', values: {} });
    expect(getCaptionAt(timeline, 1200)).toEqual({ key: 'push', values: { update: 1 } });
    expect(getCaptionAt(timeline, 1500)).toEqual({ key: 'pushArrives', values: { update: 1, delay: 300 } });
    expect(getCaptionAt(timeline, 7000)).toEqual({ key: 'clientMessage', values: {} });
    expect(getCaptionAt(timeline, 7300)).toEqual({ key: 'clientMessageArrives', values: {} });
  });
});
