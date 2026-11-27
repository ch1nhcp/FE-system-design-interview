'use client';

import { PauseIcon, PlayIcon, RotateCcwIcon, StepBackIcon, StepForwardIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

import type { Playback } from './use-playback';

type Props = {
  playback: Playback;
};

export function PlaybackControls({ playback }: Props) {
  const t = useTranslations('Visuals.playback');

  return (
    <div role="group" aria-label={t('controls')} className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" aria-label={t('restart')} onClick={playback.restart}>
        <RotateCcwIcon aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('stepBack')}
        disabled={playback.isAtStart}
        onClick={playback.stepBack}
      >
        <StepBackIcon aria-hidden />
      </Button>
      {playback.isPlaying ? (
        <Button variant="secondary" size="icon-sm" aria-label={t('pause')} onClick={playback.pause}>
          <PauseIcon aria-hidden />
        </Button>
      ) : (
        <Button variant="secondary" size="icon-sm" aria-label={t('play')} onClick={playback.play}>
          <PlayIcon aria-hidden />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('stepForward')}
        disabled={playback.isAtEnd}
        onClick={playback.stepForward}
      >
        <StepForwardIcon aria-hidden />
      </Button>
    </div>
  );
}
