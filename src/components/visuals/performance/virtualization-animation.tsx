'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AnimationFrame } from '../playback/animation-frame';
import { useTimelinePlayback } from '../playback/use-timeline-playback';
import { LIST_GEOMETRY, LIST_MODES, LIST_TIMELINE, getListState } from './virtualization-model';
import type { ListMode } from './virtualization-model';

export function VirtualizationAnimation() {
  const t = useTranslations('Visuals.virtualization');
  const [mode, setMode] = useState<ListMode>('windowed');
  const { figureRef, playback, time } = useTimelinePlayback(LIST_TIMELINE);
  const state = getListState(mode, time);
  const visibleRows = LIST_GEOMETRY.viewportHeight / LIST_GEOMETRY.rowHeight;
  return (
    <AnimationFrame
      figureRef={figureRef}
      title={t('title')}
      modeLabel={t('modeLabel')}
      modes={LIST_MODES.map((value) => ({ value, label: t(`modes.${value}`) }))}
      mode={mode}
      onModeChange={(next) => {
        setMode(next);
        playback.restart();
      }}
      caption={t(time < 0 ? 'captions.idle' : time >= LIST_TIMELINE.duration ? 'captions.end' : `captions.${mode}`)}
      playback={playback}
      stats={[
        { label: t('mounted'), value: state.mounted },
        { label: t('total'), value: LIST_GEOMETRY.count },
      ]}
    >
      <p className="text-sm">{t('range', { first: state.first + 1, last: state.visibleEnd })}</p>
      <svg viewBox="0 0 360 190" role="img" aria-label={t('diagram')} className="h-auto w-full">
        {Array.from({ length: state.visibleEnd - state.first }, (_, index) => state.first + index).map((row, index) => (
          <g key={row}>
            <rect x={4} y={4 + index * 34} width={340} height={30} rx={4} className="fill-muted stroke-border" />
            <text x={16} y={24 + index * 34} className="fill-foreground text-[12px]">
              {t('row', { number: row + 1 })}
            </text>
          </g>
        ))}
        <rect x={351} y={4} width={5} height={166} rx={2} className="fill-muted" />
        <rect
          x={351}
          y={4 + (state.first / (LIST_GEOMETRY.count - visibleRows)) * 146}
          width={5}
          height={20}
          rx={2}
          className="fill-muted-foreground"
        />
      </svg>
      <p className="text-muted-foreground text-xs">{t('note')}</p>
    </AnimationFrame>
  );
}
