'use client';

import { CheckIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { TopicLabel } from '@/components/site/topic-label';
import { Link } from '@/i18n/navigation';
import type { Section, TopicSlug } from '@/lib/topics/registry';
import { countLearned, useProgressStore } from '@/stores/use-progress-store';

type Props = {
  section: Section;
  /** Summary from each topic's content, when the topic has a cheatsheet. */
  summaries: Partial<Record<TopicSlug, string>>;
};

export function SectionTopicList({ section, summaries }: Props) {
  const t = useTranslations('Section');
  const tTopic = useTranslations('Topic');
  const topics = useProgressStore((state) => state.topics);
  const total = section.topics.length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm tabular-nums">
        {t('topicCount', { count: total })} ·{' '}
        {t('learnedCount', { learned: countLearned(topics, section.topics), total })}
      </p>
      <ol className="flex flex-col gap-3">
        {section.topics.map((topic: TopicSlug) => {
          const status = topics[topic];
          return (
            // The link stretches over the card, so its accessible name stays just the topic title.
            <li
              key={topic}
              className="bg-card ring-foreground/10 has-[a:hover]:ring-foreground/25 has-[a:focus-visible]:ring-ring/50 relative flex flex-col gap-1 rounded-xl p-4 ring-1 has-[a:focus-visible]:ring-3"
            >
              <div className="flex items-start justify-between gap-3">
                <Link href={`/topics/${topic}`} className="font-medium outline-none after:absolute after:inset-0">
                  <TopicLabel slug={topic} />
                </Link>
                {status === 'learned' && (
                  <span className="text-muted-foreground shrink-0">
                    <CheckIcon aria-hidden className="size-4" />
                    <span className="sr-only">{tTopic('learned')}</span>
                  </span>
                )}
                {status === 'review' && (
                  <span className="text-muted-foreground shrink-0">
                    <RotateCcwIcon aria-hidden className="size-4" />
                    <span className="sr-only">{tTopic('reviewAgain')}</span>
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{summaries[topic] ?? t('comingSoon')}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
