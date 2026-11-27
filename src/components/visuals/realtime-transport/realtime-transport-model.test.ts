import { describe, expect, it } from 'vitest';

import { buildTransportTimeline, getCaptionAt, getStatsAt, getWaitingSpans } from './realtime-transport-model';
import type { TransportConfig } from './realtime-transport-model';

const config: TransportConfig = {
  duration: 9000,
  latency: 300,
  pollInterval: 2000,
  serverUpdates: [1200, 4700, 5300],
};

describe('buildTransportTimeline', () => {
  it('polls on a fixed interval and answers each request with or without data', () => {
    const timeline = buildTransportTimeline('shortPolling', config);

    const requests = timeline.messages.filter((message) => message.kind === 'request');
    expect(requests.map((request) => request.sentAt)).toEqual([0, 2000, 4000, 6000, 8000]);

    const responses = timeline.messages.filter((message) => message.direction === 'toClient');
    expect(responses.map((response) => [response.kind, response.updateIds])).toEqual([
      ['emptyResponse', []],
      ['dataResponse', [1]],
      ['emptyResponse', []],
      ['dataResponse', [2, 3]],
      ['emptyResponse', []],
    ]);
  });

  it('opens a WebSocket once and pushes every update as soon as it is ready', () => {
    const timeline = buildTransportTimeline('webSocket', config);

    expect(timeline.messages.map((message) => [message.kind, message.sentAt, message.arrivesAt])).toEqual([
      ['handshake', 0, 300],
      ['handshakeAck', 300, 600],
      ['push', 1200, 1500],
      ['push', 4700, 5000],
      ['push', 5300, 5600],
    ]);
  });

  it('waits for the connection before pushing an update that is ready earlier', () => {
    const timeline = buildTransportTimeline('webSocket', { ...config, serverUpdates: [100] });

    const push = timeline.messages.find((message) => message.kind === 'push');

    expect(push).toMatchObject({ sentAt: 600, arrivesAt: 900, updateIds: [1] });
  });

  it('exposes sorted, unique step stops covering every event', () => {
    const timeline = buildTransportTimeline('webSocket', config);

    expect(timeline.stops).toEqual([0, 300, 600, 1200, 1500, 4700, 5000, 5300, 5600]);
  });
});

describe('getStatsAt', () => {
  it('counts requests, wasted responses and the delay of delivered updates', () => {
    const timeline = buildTransportTimeline('shortPolling', config);

    expect(getStatsAt(timeline, 0)).toEqual({ requests: 1, wasted: 0, averageDelay: null });
    expect(getStatsAt(timeline, 2600)).toEqual({ requests: 2, wasted: 1, averageDelay: 1400 });
    expect(getStatsAt(timeline, config.duration)).toEqual({ requests: 5, wasted: 3, averageDelay: 1533 });
  });

  it('shows a much lower delay for WebSocket pushes', () => {
    const timeline = buildTransportTimeline('webSocket', config);

    expect(getStatsAt(timeline, config.duration)).toEqual({ requests: 1, wasted: 0, averageDelay: 300 });
  });
});

describe('getWaitingSpans', () => {
  it('grows while an update waits on the server and stops when it is sent', () => {
    const timeline = buildTransportTimeline('shortPolling', config);

    expect(getWaitingSpans(timeline, 1000)).toEqual([]);
    expect(getWaitingSpans(timeline, 1800)).toEqual([{ updateId: 1, from: 1200, to: 1800 }]);
    expect(getWaitingSpans(timeline, 3000)).toEqual([{ updateId: 1, from: 1200, to: 2300 }]);
  });

  it('is almost empty for WebSocket pushes', () => {
    const timeline = buildTransportTimeline('webSocket', config);

    expect(getWaitingSpans(timeline, 2000)).toEqual([{ updateId: 1, from: 1200, to: 1200 }]);
  });
});

describe('getCaptionAt', () => {
  it('starts idle before anything happens', () => {
    const timeline = buildTransportTimeline('shortPolling', config);

    expect(getCaptionAt(timeline, -1)).toEqual({ key: 'idle', values: {} });
  });

  it('describes the latest event at a given time', () => {
    const timeline = buildTransportTimeline('shortPolling', config);

    expect(getCaptionAt(timeline, 0)).toEqual({ key: 'pollRequest', values: {} });
    expect(getCaptionAt(timeline, 600)).toEqual({ key: 'emptyResponse', values: {} });
    expect(getCaptionAt(timeline, 1200)).toEqual({ key: 'serverUpdate', values: { update: 1 } });
    expect(getCaptionAt(timeline, 2600)).toEqual({ key: 'dataResponse', values: { updates: '#1', delay: 1400 } });
    expect(getCaptionAt(timeline, 6600)).toEqual({ key: 'dataResponse', values: { updates: '#2, #3', delay: 1900 } });
  });

  it('describes WebSocket pushes with their delay', () => {
    const timeline = buildTransportTimeline('webSocket', config);

    expect(getCaptionAt(timeline, 600)).toEqual({ key: 'handshakeAck', values: {} });
    expect(getCaptionAt(timeline, 1200)).toEqual({ key: 'push', values: { update: 1 } });
    expect(getCaptionAt(timeline, 1500)).toEqual({ key: 'pushArrives', values: { update: 1, delay: 300 } });
  });
});
