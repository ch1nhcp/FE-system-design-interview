'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { Progress } from '@/components/ui/progress';
import { useChecklistStore } from '@/stores/use-checklist-store';

import { CHECKLIST_SECTIONS, CHECKLIST_TOTAL_ITEMS, countCheckedItems } from './checklist-data';
import { ChecklistSectionCard } from './checklist-section-card';
import { ResetProgressDialog } from './reset-progress-dialog';

const SOURCE_URL = 'https://www.greatfrontend.com';
const TITLE_ID = 'system-design-checklist-title';

export function SystemDesignChecklist() {
  const t = useTranslations('Checklist');
  const checked = useChecklistStore((state) => state.checked);

  useEffect(() => {
    void useChecklistStore.persist.rehydrate();
  }, []);

  const done = countCheckedItems(checked);
  const percent = Math.round((done / CHECKLIST_TOTAL_ITEMS) * 100);

  return (
    <section aria-labelledby={TITLE_ID} className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 id={TITLE_ID} className="text-2xl font-semibold">
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Progress value={percent} aria-label={t('progressLabel')} className="sm:flex-1" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-sm tabular-nums">
              {t('progress', { done, total: CHECKLIST_TOTAL_ITEMS })}
            </span>
            <ResetProgressDialog disabled={done === 0} />
          </div>
        </div>
      </header>
      <div className="columns-1 gap-3 sm:columns-2">
        {CHECKLIST_SECTIONS.map((section) => (
          <ChecklistSectionCard key={section.id} section={section} />
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
