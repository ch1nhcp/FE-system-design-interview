'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TOPIC_VISUALS } from '@/lib/content/topic-frontmatter';
import { cn } from '@/lib/utils';

export type VisualKind = (typeof TOPIC_VISUALS)[number];

type VisualPanelProps = {
  /** Tabs in display order; the first one opens by default. Each needs a matching `<VisualTab kind>`. */
  tabs: readonly VisualKind[];
  children: ReactNode;
};

/**
 * The visual next to a cheatsheet: an animation, a diagram and/or a code example, one tab each.
 * Topic pages move it into a sticky side column on wide screens.
 */
export function VisualPanel({ tabs, children }: VisualPanelProps) {
  const t = useTranslations('Visuals.panel');
  const [first] = tabs;

  return (
    // `topic-visual` places the panel in the side column of `.topic-body` on wide screens.
    <section aria-label={t('label')} className="topic-visual flex flex-col gap-3">
      <Tabs defaultValue={first} className="gap-3">
        {tabs.length > 1 && (
          <TabsList className="w-full">
            {tabs.map((kind) => (
              <TabsTrigger key={kind} value={kind}>
                {t(kind)}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
        {children}
      </Tabs>
    </section>
  );
}

type VisualTabProps = {
  kind: VisualKind;
  children: ReactNode;
};

export function VisualTab({ kind, children }: VisualTabProps) {
  const t = useTranslations('Visuals.panel');
  return (
    <TabsContent
      value={kind}
      aria-label={t(kind)}
      className={cn('min-w-0', kind === 'code' && 'topic-code-panel focus-visible:ring-ring/50 focus-visible:ring-3')}
    >
      {children}
    </TabsContent>
  );
}
