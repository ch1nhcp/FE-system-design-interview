'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { RequestTimeline } from '../networking/request-timeline';
import { AnimationFrame } from '../playback/animation-frame';
import { useTimelinePlayback } from '../playback/use-timeline-playback';
import { LOADING_MODES, buildLoadingTimeline, getLoadingState } from './loading-model';
import type { LoadingMode } from './loading-model';

export function LoadingAnimation() {
  const t = useTranslations('Visuals.loading');
  const [mode, setMode] = useState<LoadingMode>('parallel');
  const timeline = buildLoadingTimeline(mode);
  const { figureRef, playback, time } = useTimelinePlayback(timeline);
  const state = getLoadingState(timeline, time);
  return (
    <AnimationFrame
      figureRef={figureRef}
      title={t('title')}
      modeLabel={t('modeLabel')}
      modes={LOADING_MODES.map((value) => ({ value, label: t(`modes.${value}`) }))}
      mode={mode}
      onModeChange={(next) => {
        setMode(next);
        playback.restart();
      }}
      caption={t(`captions.${state.caption}`)}
      playback={playback}
      stats={[
        { label: t('complete'), value: `${state.complete}/4` },
        { label: t('visibleAt'), value: state.ready ? t('ms', { value: timeline.readyAt }) : '…' },
      ]}
    >
      <div className="bg-muted rounded-lg p-3 text-sm">{state.ready ? t('content') : t('placeholder')}</div>
      <RequestTimeline
        duration={timeline.duration}
        time={time}
        label={t('diagram')}
        timeLabel={t('ms', { value: timeline.duration })}
        lanes={timeline.tasks.map((task) => ({
          label: t(`resources.${task.resource}`),
          requests: [{ ...task, label: t(`resources.${task.resource}`), outcome: '✓' }],
        }))}
      />
      <p className="text-muted-foreground text-xs">{t(`note.${mode}`)}</p>
    </AnimationFrame>
  );
}
