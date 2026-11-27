'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Progress } from '@/components/ui/progress';
import { SECTIONS, TOPIC_SLUGS } from '@/lib/topics/registry';
import { countLearned, useProgressStore } from '@/stores/use-progress-store';

import { ResetProgressDialog } from './reset-progress-dialog';
import { ReviewList } from './review-list';
import { SectionChecklistCard } from './section-checklist-card';

const SOURCE_URL = 'https://www.greatfrontend.com';
const TITLE_ID = 'dashboard-title';

export function Dashboard() {
  const t = useTranslations('Dashboard');
  const topics = useProgressStore((state) => state.topics);
  const hasProgress = Object.keys(topics).length > 0;

  const total = TOPIC_SLUGS.length;
  const done = countLearned(topics, TOPIC_SLUGS);
  const percent = Math.round((done / total) * 100);

  return (
    <section aria-labelledby={TITLE_ID} className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 id={TITLE_ID} className="text-2xl font-semibold">
            {t('title')}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">{t('description')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Progress value={percent} aria-label={t('progressLabel')} className="sm:flex-1" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-sm tabular-nums">{t('progress', { done, total })}</span>
            <ResetProgressDialog disabled={!hasProgress} />
          </div>
        </div>
      </header>
      <ReviewList />
      <div className="columns-1 gap-3 sm:columns-2">
        {SECTIONS.map((section) => (
          <SectionChecklistCard key={section.slug} section={section} />
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        {t.rich('source', {
          link: (chunks: ReactNode) => (
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-4"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </section>
  );
}
