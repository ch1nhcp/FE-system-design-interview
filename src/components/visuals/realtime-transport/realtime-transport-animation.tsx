'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { PlaybackControls } from '../playback/playback-controls';
import { useAutoPlayWhenVisible } from '../playback/use-autoplay-when-visible';
import { usePlayback } from '../playback/use-playback';
import { usePrefersReducedMotion } from '../playback/use-prefers-reduced-motion';
import { RealtimeTransportDiagram } from './realtime-transport-diagram';
import { buildTransportTimeline, getCaptionAt, getStatsAt } from './realtime-transport-model';
import type { TransportMode } from './realtime-transport-model';

const MODES: readonly TransportMode[] = ['shortPolling', 'webSocket'];

/** Quiet moment before the first event, so "start" shows an idle state and the first step shows the first event. */
const LEAD_IN = 400;

type Props = {
  initialMode?: TransportMode;
};

export function RealtimeTransportAnimation({ initialMode = 'shortPolling' }: Props) {
  const t = useTranslations('Visuals.realtimeTransport');
  const [mode, setMode] = useState<TransportMode>(initialMode);
  const figureRef = useRef<HTMLElement>(null);

  const timeline = buildTransportTimeline(mode);
  const playback = usePlayback({
    duration: timeline.duration + LEAD_IN,
    stops: timeline.stops.map((stop) => stop + LEAD_IN),
  });
  const reducedMotion = usePrefersReducedMotion();
  useAutoPlayWhenVisible(figureRef, playback.play, !reducedMotion);

  const time = playback.time - LEAD_IN;
  const caption = getCaptionAt(timeline, time);
  const stats = getStatsAt(timeline, time);

  const selectMode = (next: TransportMode) => {
    setMode(next);
    playback.restart();
  };

  return (
    <figure ref={figureRef} className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-3 ring-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption className="text-sm font-medium">{t('title')}</figcaption>
        <div role="group" aria-label={t('modeLabel')} className="bg-muted flex gap-0.5 rounded-lg p-0.5">
          {MODES.map((option) => (
            <Button
              key={option}
              size="xs"
              variant={option === mode ? 'outline' : 'ghost'}
              aria-pressed={option === mode}
              onClick={() => selectMode(option)}
            >
              {t(option)}
            </Button>
          ))}
        </div>
      </div>

      <RealtimeTransportDiagram
        timeline={timeline}
        time={time}
        label={t('diagramLabel', { mode: t(mode), seconds: timeline.duration / 1000 })}
        serverLabel={t('server')}
        clientLabel={t('client')}
      />

      <p aria-live="polite" className="min-h-10 text-sm">
        {t(`captions.${caption.key}`, caption.values)}
      </p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <PlaybackControls playback={playback} />
        {/* Subgrid rows keep every value on one line even when a label wraps. */}
        <dl className="grid grid-cols-3 grid-rows-[auto_auto] gap-x-4 text-xs">
          <div className="row-span-2 grid grid-rows-subgrid">
            <dt className="text-muted-foreground">{t('statsRequests')}</dt>
            <dd className="font-medium tabular-nums">{stats.requests}</dd>
          </div>
          <div className="row-span-2 grid grid-rows-subgrid">
            <dt className="text-muted-foreground">{t('statsWasted')}</dt>
            <dd className="font-medium tabular-nums">{stats.wasted}</dd>
          </div>
          <div className="row-span-2 grid grid-rows-subgrid">
            <dt className="text-muted-foreground">{t('statsDelay')}</dt>
            <dd className="font-medium tabular-nums">
              {stats.averageDelay === null ? t('noDelay') : t('delayValue', { delay: stats.averageDelay })}
            </dd>
          </div>
        </dl>
      </div>
    </figure>
  );
}
