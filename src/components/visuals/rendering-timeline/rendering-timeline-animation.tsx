'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AnimationFrame } from '../playback/animation-frame';
import { useTimelinePlayback } from '../playback/use-timeline-playback';
import { RenderingTimelineDiagram } from './rendering-timeline-diagram';
import {
  RENDERING_MODES,
  buildRenderingTimeline,
  getRenderingCaptionAt,
  getScreenAt,
} from './rendering-timeline-model';
import type { RenderingMode } from './rendering-timeline-model';
import { ScreenMock } from './screen-mock';

type Props = {
  initialMode?: RenderingMode;
};

export function RenderingTimelineAnimation({ initialMode = 'csr' }: Props) {
  const t = useTranslations('Visuals.rendering');
  const [mode, setMode] = useState<RenderingMode>(initialMode);

  const timeline = buildRenderingTimeline(mode);
  const { figureRef, playback, time } = useTimelinePlayback(timeline);
  const screen = getScreenAt(timeline, time);
  const { contentVisible, interactive } = timeline.milestones;
  const milestoneValue = (at: number) => (time >= at ? t('msValue', { ms: at }) : t('pending'));

  return (
    <AnimationFrame
      figureRef={figureRef}
      title={t('title')}
      modeLabel={t('modeLabel')}
      modes={RENDERING_MODES.map((value) => ({ value, label: t(`modes.${value}`) }))}
      mode={mode}
      onModeChange={(next) => {
        setMode(next);
        playback.restart();
      }}
      caption={t(`captions.${getRenderingCaptionAt(timeline, time)}`)}
      stats={[
        { label: t('statsVisible'), value: milestoneValue(contentVisible) },
        { label: t('statsInteractive'), value: milestoneValue(interactive) },
        { label: t('statsJavascript'), value: t('kbValue', { kb: timeline.javascriptKb }) },
      ]}
      playback={playback}
    >
      <ScreenMock
        screen={screen}
        label={t(`screen.${screen.view}`)}
        interactiveLabel={t('interactive')}
        notInteractiveLabel={t('notInteractive')}
      />
      <RenderingTimelineDiagram
        timeline={timeline}
        time={time}
        label={t('diagramLabel', { mode: t(`modes.${mode}`) })}
        laneLabels={{ server: t('lanes.server'), network: t('lanes.network'), browser: t('lanes.browser') }}
        taskLabel={(taskId) => t(`tasks.${taskId}`)}
        visibleLabel={t('visible')}
        interactiveLabel={t('interactive')}
      />
    </AnimationFrame>
  );
}
