import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import type { TopicSlug } from '@/lib/topics/registry';

/** Rich tags allowed in topic labels, e.g. `<code>srcset</code>`. */
export const topicLabelTags = {
  code: (chunks: ReactNode) => (
    <code className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-[0.85em]">{chunks}</code>
  ),
};

/** Plain-text version of the rich tags, for `aria-label`, `<title>` and other attributes. */
export const topicLabelMarkup = {
  code: (chunks: string) => chunks,
};

export function TopicLabel({ slug }: { slug: TopicSlug }) {
  const t = useTranslations('Topics');
  return <>{t.rich(slug, topicLabelTags)}</>;
}
