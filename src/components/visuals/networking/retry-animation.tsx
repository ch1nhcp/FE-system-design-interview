'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AnimationFrame } from '../playback/animation-frame';
import { useTimelinePlayback } from '../playback/use-timeline-playback';
import { RequestTimeline } from './request-timeline';
import { RETRY_MODES, buildRetryTimeline, getRetryState } from './retry-model';
import type { RetryMode } from './retry-model';

export function RetryAnimation() {
  const t = useTranslations('Visuals.retries');
  const [mode, setMode] = useState<RetryMode>('jitter');
  const timeline = buildRetryTimeline(mode);
  const { figureRef, playback, time } = useTimelinePlayback(timeline);
  const state = getRetryState(timeline, time);
  return (
    <AnimationFrame
      figureRef={figureRef}
      title={t('title')}
      modeLabel={t('modeLabel')}
      modes={RETRY_MODES.map((value) => ({ value, label: t(`modes.${value}`) }))}
      mode={mode}
      onModeChange={(next) => {
        setMode(next);
        playback.restart();
      }}
      caption={t(`captions.${state.caption}`)}
      stats={[
        { label: t('sent'), value: state.sent },
        { label: t('recovered'), value: `${state.recovered}/3` },
      ]}
      playback={playback}
    >
      <p className="text-muted-foreground text-xs">{t(`explanation.${mode}`)}</p>
      <RequestTimeline
        duration={timeline.duration}
        time={time}
        label={t('diagramLabel')}
        timeLabel={t('ms', { value: timeline.duration })}
        lanes={[0, 1, 2].map((client) => ({
          label: t('client', { number: client + 1 }),
          requests: timeline.attempts
            .filter((attempt) => attempt.client === client)
            .map((attempt) => ({
              ...attempt,
              label: t('attempt', { number: attempt.number }),
              outcome: attempt.succeeds ? '✓' : '×',
            })),
        }))}
      />
      <p className="text-muted-foreground text-xs">{t('legend')}</p>
    </AnimationFrame>
  );
}
