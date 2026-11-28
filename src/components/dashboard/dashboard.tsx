'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { ProgressFilter } from '@/components/study/progress-filter';
import type { ProgressFilterValue } from '@/components/study/progress-filter';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
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
  const [filter, setFilter] = useState<ProgressFilterValue>('all');
  const shownRef = useRef<HTMLParagraphElement>(null);
  const visibleTopics = TOPIC_SLUGS.filter((topic) => filter === 'all' || topics[topic] === 'review');
  const visible = new Set(visibleTopics);
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
      {filter === 'all' && <ReviewList />}
      <ProgressFilter value={filter} onChange={setFilter} />
      <p
        ref={shownRef}
        tabIndex={-1}
        role="status"
        className="text-muted-foreground focus-visible:ring-ring/50 rounded-sm text-sm outline-none focus-visible:ring-3"
      >
        {t('shown', { count: visibleTopics.length })}
      </p>
      {visibleTopics.length > 0 && (
        <div className="columns-1 gap-3 sm:columns-2">
          {SECTIONS.filter((section) => section.topics.some((topic) => visible.has(topic))).map((section) => (
            <SectionChecklistCard
              key={section.slug}
              section={section}
              visibleTopics={section.topics.filter((topic) => visible.has(topic))}
              onLearned={filter === 'review' ? () => shownRef.current?.focus() : undefined}
            />
          ))}
        </div>
      )}
      {visibleTopics.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('reviewEmpty')}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => setFilter('all')}>
              {t('showAll')}
            </Button>
          </EmptyContent>
        </Empty>
      )}
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
