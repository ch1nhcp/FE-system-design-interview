'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AnimationFrame } from '../playback/animation-frame';
import { useTimelinePlayback } from '../playback/use-timeline-playback';
import { RATE_MODES, buildRateTimeline, getRateState } from './rate-model';
import type { RateMode } from './rate-model';

export function RateAnimation() {
  const t = useTranslations('Visuals.rate');
  const [mode, setMode] = useState<RateMode>('debounce');
  const timeline = buildRateTimeline(mode);
  const { figureRef, playback, time } = useTimelinePlayback(timeline);
  const state = getRateState(timeline, time);
  const toX = (at: number) => 80 + (Math.max(0, Math.min(at, timeline.duration)) / timeline.duration) * 270;
  return (
    <AnimationFrame
      figureRef={figureRef}
      title={t('title')}
      modeLabel={t('modeLabel')}
      modes={RATE_MODES.map((value) => ({ value, label: t(`modes.${value}`) }))}
      mode={mode}
      onModeChange={(next) => {
        setMode(next);
        playback.restart();
      }}
      caption={t(`captions.${state.caption}`)}
      playback={playback}
      stats={[
        { label: t('inputs'), value: state.inputs },
        { label: t('dispatches'), value: state.dispatches },
        { label: t('latest'), value: state.value ?? '…' },
      ]}
    >
      <p className="text-muted-foreground text-xs">{t(`policy.${mode}`)}</p>
      <svg viewBox="0 0 360 140" role="img" aria-label={t('diagram')} className="h-auto w-full">
        {[
          { label: t('inputs'), events: timeline.inputs },
          { label: t('dispatches'), events: timeline.dispatches },
        ].map((lane, index) => (
          <g key={lane.label}>
            <text x={0} y={32 + index * 48} className="fill-muted-foreground text-[11px]">
              {lane.label}
            </text>
            <line x1={80} x2={350} y1={28 + index * 48} y2={28 + index * 48} className="stroke-border" />
            {lane.events
              .filter((event) => event.at <= time)
              .map((event) => (
                <g key={event.at}>
                  <circle cx={toX(event.at)} cy={28 + index * 48} r={4} className="fill-foreground" />
                  <text
                    x={toX(event.at)}
                    y={47 + index * 48}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {event.value}
                  </text>
                </g>
              ))}
          </g>
        ))}
        <text x={80} y={128} className="fill-muted-foreground text-[10px]">
          0
        </text>
        <text x={350} y={128} textAnchor="end" className="fill-muted-foreground text-[10px]">
          {t('ms', { value: timeline.duration })}
        </text>
      </svg>
      <p className="text-muted-foreground text-xs">{t('note')}</p>
    </AnimationFrame>
  );
}
