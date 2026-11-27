'use client';

import { RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { topicLabelMarkup, TopicLabel } from '@/components/site/topic-label';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from '@/i18n/navigation';
import type { Section, TopicSlug } from '@/lib/topics/registry';
import { countLearned, useProgressStore } from '@/stores/use-progress-store';

type Props = {
  section: Section;
};

export function SectionChecklistCard({ section }: Props) {
  const t = useTranslations('Dashboard');
  const tSections = useTranslations('Sections');
  const tTopics = useTranslations('Topics');
  const tTopic = useTranslations('Topic');
  const topics = useProgressStore((state) => state.topics);
  const setStatus = useProgressStore((state) => state.setStatus);

  const headingId = `dashboard-${section.slug}`;
  const sectionTitle = tSections(`${section.slug}.title`);
  const learned = countLearned(topics, section.topics);
  const total = section.topics.length;

  return (
    <Card size="sm" className="mb-3 break-inside-avoid">
      <CardHeader>
        <CardTitle>
          <h2 id={headingId}>
            <Link
              href={`/sections/${section.slug}`}
              className="focus-visible:ring-ring/50 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3"
            >
              {sectionTitle}
            </Link>
          </h2>
        </CardTitle>
        <CardAction>
          <Badge variant={learned === total ? 'default' : 'secondary'} className="tabular-nums">
            {learned}/{total}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul aria-labelledby={headingId} className="flex flex-col gap-2.5">
          {section.topics.map((topic: TopicSlug) => {
            const status = topics[topic];
            return (
              <li key={topic} className="flex items-start gap-2.5">
                <Checkbox
                  className="mt-0.5"
                  aria-label={t('learnedLabel', { topic: tTopics.markup(topic, topicLabelMarkup) })}
                  checked={status === 'learned'}
                  onCheckedChange={(value) => setStatus(topic, value === true ? 'learned' : null)}
                />
                <Link
                  href={`/topics/${topic}`}
                  className="focus-visible:ring-ring/50 min-w-0 rounded-sm leading-snug underline-offset-4 outline-none hover:underline focus-visible:ring-3"
                >
                  <TopicLabel slug={topic} />
                </Link>
                {status === 'review' && (
                  <span className="text-muted-foreground mt-0.5 ml-auto shrink-0" title={tTopic('reviewAgain')}>
                    <RotateCcwIcon aria-hidden className="size-3.5" />
                    <span className="sr-only">{tTopic('reviewAgain')}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
