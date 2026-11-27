'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AnimationFrame } from '../playback/animation-frame';
import { useTimelinePlayback } from '../playback/use-timeline-playback';
import { RACE_MODES, RACE_TIMELINE, getRaceState } from './race-model';
import type { RaceMode } from './race-model';
import { RequestTimeline } from './request-timeline';

export function RaceAnimation() {
  const t = useTranslations('Visuals.race');
  const [mode, setMode] = useState<RaceMode>('latest');
  const { figureRef, playback, time } = useTimelinePlayback(RACE_TIMELINE);
  const state = getRaceState(mode, time);
  return (
    <AnimationFrame
      figureRef={figureRef}
      title={t('title')}
      modeLabel={t('modeLabel')}
      modes={RACE_MODES.map((value) => ({ value, label: t(`modes.${value}`) }))}
      mode={mode}
      onModeChange={(next) => {
        setMode(next);
        playback.restart();
      }}
      caption={t(`captions.${state.caption}`)}
      stats={[{ label: t('ignored'), value: state.ignored }]}
      playback={playback}
    >
      <div className="bg-muted flex flex-col gap-2 rounded-lg p-3 text-sm">
        <p>
          {t('query')}: <strong>{t(`terms.${state.query}`)}</strong>
        </p>
        <p>
          {t('result')}: <strong>{t(`terms.${state.result}`)}</strong>
        </p>
      </div>
      <RequestTimeline
        duration={RACE_TIMELINE.duration}
        time={time}
        label={t('diagramLabel')}
        timeLabel={t('ms', { value: RACE_TIMELINE.duration })}
        lanes={RACE_TIMELINE.requests.map((request) => ({
          label: t(`terms.${request.term}`),
          requests: [{ ...request, label: t('request', { query: t(`terms.${request.term}`) }), outcome: '✓' }],
        }))}
      />
      <p className="text-muted-foreground text-xs">{t('note')}</p>
    </AnimationFrame>
  );
}
