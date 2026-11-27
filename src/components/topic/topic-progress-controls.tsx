'use client';

import { RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { TopicSlug } from '@/lib/topics/registry';
import { useProgressStore } from '@/stores/use-progress-store';

type Props = {
  topic: TopicSlug;
};

export function TopicProgressControls({ topic }: Props) {
  const t = useTranslations('Topic');
  const status = useProgressStore((state) => state.topics[topic]);
  const setStatus = useProgressStore((state) => state.setStatus);
  const checkboxId = `topic-learned-${topic}`;

  return (
    <div role="group" aria-label={t('progress')} className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id={checkboxId}
          checked={status === 'learned'}
          onCheckedChange={(value) => setStatus(topic, value === true ? 'learned' : null)}
        />
        <Label htmlFor={checkboxId} className="font-normal">
          {t('learned')}
        </Label>
      </div>
      <Button
        variant={status === 'review' ? 'secondary' : 'ghost'}
        size="sm"
        aria-pressed={status === 'review'}
        onClick={() => setStatus(topic, status === 'review' ? null : 'review')}
      >
        <RotateCcwIcon aria-hidden />
        {t('reviewAgain')}
      </Button>
    </div>
  );
}
