'use client';

import { useTranslations } from 'next-intl';

import { TopicLabel } from '@/components/site/topic-label';
import { Link } from '@/i18n/navigation';
import { TOPIC_SLUGS } from '@/lib/topics/registry';
import { useProgressStore } from '@/stores/use-progress-store';

const HEADING_ID = 'dashboard-review';

export function ReviewList() {
  const t = useTranslations('Dashboard');
  const topics = useProgressStore((state) => state.topics);
  const toReview = TOPIC_SLUGS.filter((topic) => topics[topic] === 'review');

  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-2">
      <h2 id={HEADING_ID} className="text-base font-medium">
        {t('reviewTitle')}
      </h2>
      {toReview.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('reviewEmpty')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {toReview.map((topic) => (
            <li key={topic}>
              <Link
                href={`/topics/${topic}`}
                className="bg-muted hover:bg-muted/70 focus-visible:ring-ring/50 inline-flex rounded-full px-3 py-1 text-sm outline-none focus-visible:ring-3"
              >
                <TopicLabel slug={topic} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
