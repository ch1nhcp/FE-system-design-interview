import { loader } from 'fumadocs-core/source';
import { defineDocs } from 'fumadocs-mdx/macro';
import type { Locale } from 'next-intl';

import { routing } from '@/i18n/routing';
import type { TopicSlug } from '@/lib/topics/registry';

import { topicFrontmatterSchema } from './topic-frontmatter';

const topics = defineDocs({
  dir: 'content/topics',
  docs: { schema: topicFrontmatterSchema },
});

const topicSource = loader({
  baseUrl: '/topics',
  source: topics.toFumadocsSource(),
  i18n: {
    languages: [...routing.locales],
    defaultLanguage: routing.defaultLocale,
    // `websockets.mdx` is English, `websockets.vi.mdx` is its Vietnamese translation.
    parser: 'dot',
  },
});

export type TopicPage = NonNullable<ReturnType<typeof topicSource.getPage>>;

export type TopicContent = {
  page: TopicPage;
  /** True when the locale has no translation and the English content is shown instead. */
  isFallback: boolean;
};

export function getTopicContent(slug: TopicSlug, locale: Locale): TopicContent | null {
  const page = topicSource.getPage([slug], locale);
  if (!page) {
    return null;
  }

  // Fumadocs falls back to English transparently and still reports the requested locale, so compare the data.
  const englishPage = topicSource.getPage([slug], routing.defaultLocale);
  const isFallback = locale !== routing.defaultLocale && page.data === englishPage?.data;

  return { page, isFallback };
}
