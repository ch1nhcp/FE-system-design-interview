import type { I18nConfig } from 'fumadocs-core/i18n';
import { loader } from 'fumadocs-core/source';
import { defineDocs } from 'fumadocs-mdx/macro';
import type { Locale } from 'next-intl';

import { routing } from '@/i18n/routing';
import type { SectionSlug, TopicSlug } from '@/lib/topics/registry';

import { sectionFrontmatterSchema, topicFrontmatterSchema } from './topic-frontmatter';

const topics = defineDocs({
  dir: 'content/topics',
  docs: { schema: topicFrontmatterSchema, postprocess: { includeMDAST: true } },
});

const sections = defineDocs({
  dir: 'content/sections',
  docs: { schema: sectionFrontmatterSchema },
});

const i18n: I18nConfig<Locale> = {
  languages: [...routing.locales],
  defaultLanguage: routing.defaultLocale,
  // `websockets.mdx` is English, `websockets.vi.mdx` is its Vietnamese translation.
  parser: 'dot',
};

const sectionSource = loader({
  baseUrl: '/sections',
  source: sections.toFumadocsSource(),
  i18n,
});

const topicSource = loader({
  baseUrl: '/topics',
  source: topics.toFumadocsSource(),
  i18n,
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

export type SectionOverview = NonNullable<ReturnType<typeof sectionSource.getPage>>;

/** Optional overview shown at the top of a section page, such as a comparison table. */
export function getSectionOverview(slug: SectionSlug, locale: Locale): SectionOverview | null {
  return sectionSource.getPage([slug], locale) ?? null;
}
