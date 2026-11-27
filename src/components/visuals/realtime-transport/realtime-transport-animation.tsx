'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AnimationFrame } from '../playback/animation-frame';
import { useTimelinePlayback } from '../playback/use-timeline-playback';
import { RealtimeTransportDiagram } from './realtime-transport-diagram';
import { buildTransportTimeline, getCaptionAt, getStatsAt } from './realtime-transport-model';
import type { TransportMode } from './realtime-transport-model';
import { TransportLegend } from './transport-legend';

const MODES: readonly TransportMode[] = ['shortPolling', 'longPolling', 'serverSentEvents', 'webSocket'];

type Props = {
  initialMode?: TransportMode;
};

export function RealtimeTransportAnimation({ initialMode = 'shortPolling' }: Props) {
  const t = useTranslations('Visuals.realtimeTransport');
  const [mode, setMode] = useState<TransportMode>(initialMode);

  const timeline = buildTransportTimeline(mode);
  const { figureRef, playback, time } = useTimelinePlayback(timeline);
  const caption = getCaptionAt(timeline, time);
  const stats = getStatsAt(timeline, time);

  return (
    <AnimationFrame
      figureRef={figureRef}
      title={t('title')}
      modeLabel={t('modeLabel')}
      modes={MODES.map((value) => ({ value, label: t(value) }))}
      mode={mode}
      onModeChange={(next) => {
        setMode(next);
        playback.restart();
      }}
      caption={t(`captions.${caption.key}`, caption.values)}
      stats={[
        { label: t('statsRequests'), value: stats.requests },
        { label: t('statsWasted'), value: stats.wasted },
        {
          label: t('statsDelay'),
          value: stats.averageDelay === null ? t('noDelay') : t('delayValue', { delay: stats.averageDelay }),
        },
      ]}
      playback={playback}
    >
      <RealtimeTransportDiagram
        timeline={timeline}
        time={time}
        label={t('diagramLabel', { mode: t(mode), seconds: timeline.duration / 1000 })}
        serverLabel={t('server')}
        clientLabel={t('client')}
      />
      <TransportLegend mode={mode} />
    </AnimationFrame>
  );
}
