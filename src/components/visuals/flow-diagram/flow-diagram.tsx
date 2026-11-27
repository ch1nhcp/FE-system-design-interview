import { ArrowDownIcon, CornerLeftUpIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type FlowStep = {
  title: string;
  note?: string;
};

type Props = {
  /** Accessible name of the diagram, e.g. "Flux data flow". */
  label: string;
  steps: readonly FlowStep[];
  /** Describes the arrow from the last step back to the first, when the flow is a cycle. */
  loop?: string;
  /** Index of a step to emphasize, e.g. the part the topic is about. */
  highlight?: number;
};

/** A vertical chain of steps, for topics about structure rather than timing. */
export function FlowDiagram({ label, steps, loop, highlight }: Props) {
  return (
    <figure aria-label={label} className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-3 ring-1">
      <figcaption className="text-sm font-medium">{label}</figcaption>
      <div className="flex gap-2">
        <ol className="flex min-w-0 flex-1 flex-col items-stretch">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col items-center">
              {index > 0 && <ArrowDownIcon aria-hidden className="text-muted-foreground my-1 size-4" />}
              <div
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-center ring-1',
                  index === highlight ? 'bg-foreground text-background ring-foreground' : 'bg-muted ring-foreground/10',
                )}
              >
                <p className="text-sm font-medium">{step.title}</p>
                {step.note && (
                  <p className={cn('text-xs', index === highlight ? 'text-background/80' : 'text-muted-foreground')}>
                    {step.note}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
        {loop && (
          <div aria-hidden className="border-foreground/30 my-5 w-3 rounded-r-lg border-y border-r border-dashed" />
        )}
      </div>
      {loop && (
        <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
          <CornerLeftUpIcon aria-hidden className="mt-px size-3.5 shrink-0" />
          {loop}
        </p>
      )}
    </figure>
  );
}
