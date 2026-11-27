import { MousePointer2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { Screen } from './rendering-timeline-model';

type Props = {
  screen: Screen;
  label: string;
  interactiveLabel: string;
  notInteractiveLabel: string;
};

function Line({ className }: { className?: string }) {
  return <div className={cn('bg-foreground/15 h-1.5 rounded-full', className)} />;
}

/** A tiny browser window showing what the user sees at this moment of the page load. */
export function ScreenMock({ screen, label, interactiveLabel, notInteractiveLabel }: Props) {
  const showsContent = screen.view === 'content' || screen.view === 'partial';

  return (
    <div role="img" aria-label={label} className="ring-foreground/10 overflow-hidden rounded-lg ring-1">
      <div aria-hidden className="bg-muted flex items-center gap-1 px-2 py-1.5">
        <span className="bg-foreground/20 size-1.5 rounded-full" />
        <span className="bg-foreground/20 size-1.5 rounded-full" />
        <span className="bg-foreground/20 size-1.5 rounded-full" />
      </div>
      <div aria-hidden className="bg-background relative flex h-28 flex-col gap-2 p-3">
        {screen.view === 'spinner' && (
          <div className="border-foreground/20 border-t-foreground m-auto size-6 rounded-full border-2 motion-safe:animate-spin" />
        )}
        {showsContent && (
          <>
            <Line className="bg-foreground/40 h-2.5 w-2/5" />
            <Line className="w-4/5" />
            <Line className="w-3/5" />
            <div className="mt-1 flex flex-1 gap-2">
              <div
                data-slow-region
                className={cn(
                  'flex-1 rounded-md',
                  screen.view === 'partial' ? 'bg-foreground/5 motion-safe:animate-pulse' : 'bg-foreground/15',
                )}
              />
              <div className="flex w-1/3 flex-col items-start justify-end gap-1">
                <div
                  className={cn(
                    'relative h-5 w-full rounded-md',
                    screen.interactive ? 'bg-foreground' : 'bg-foreground/25',
                  )}
                >
                  {screen.interactive && (
                    <MousePointer2Icon className="text-background stroke-foreground absolute -right-1 -bottom-2 size-3.5 fill-current" />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        {showsContent && (
          <span
            className={cn(
              'absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
              screen.interactive ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
            )}
          >
            {screen.interactive ? interactiveLabel : notInteractiveLabel}
          </span>
        )}
      </div>
    </div>
  );
}
