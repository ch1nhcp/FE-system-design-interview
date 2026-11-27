'use client';

import type { ReactNode, RefObject } from 'react';

import { Button } from '@/components/ui/button';

import { PlaybackControls } from './playback-controls';
import type { Playback } from './use-playback';

export type ModeOption<Mode extends string> = { value: Mode; label: string };
export type Stat = { label: string; value: ReactNode };

type Props<Mode extends string> = {
  figureRef: RefObject<HTMLElement | null>;
  title: string;
  modeLabel: string;
  modes: readonly ModeOption<Mode>[];
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  /** The animated picture: a diagram, a legend, a screen mock. */
  children: ReactNode;
  caption: ReactNode;
  stats: readonly Stat[];
  playback: Playback;
};

/** Shared frame of the step-through animations: title, mode switch, picture, caption, controls and stats. */
export function AnimationFrame<Mode extends string>({
  figureRef,
  title,
  modeLabel,
  modes,
  mode,
  onModeChange,
  children,
  caption,
  stats,
  playback,
}: Props<Mode>) {
  return (
    <figure ref={figureRef} className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-3 ring-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption className="text-sm font-medium">{title}</figcaption>
        <div role="group" aria-label={modeLabel} className="bg-muted flex flex-wrap gap-0.5 rounded-lg p-0.5">
          {modes.map((option) => (
            <Button
              key={option.value}
              size="xs"
              variant={option.value === mode ? 'outline' : 'ghost'}
              aria-pressed={option.value === mode}
              onClick={() => onModeChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {children}

      <p aria-live="polite" className="min-h-10 text-sm">
        {caption}
      </p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <PlaybackControls playback={playback} />
        {/* Subgrid rows keep every value on one line even when a label wraps. */}
        <dl
          className="grid grid-rows-[auto_auto] gap-x-4 text-xs"
          style={{ gridTemplateColumns: `repeat(${stats.length}, auto)` }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="row-span-2 grid grid-rows-subgrid">
              <dt className="text-muted-foreground">{stat.label}</dt>
              <dd className="font-medium tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </figure>
  );
}
