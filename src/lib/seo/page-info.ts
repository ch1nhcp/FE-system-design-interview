import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';

import { topicLabelMarkup } from '@/components/site/topic-label';
import { getTopicContent } from '@/lib/content/topic-source';
import { getSection, isTopicSlug } from '@/lib/topics/registry';

import type { PageInfo } from './metadata';

export const getPageInfo = cache(async (locale: Locale, id: string): Promise<PageInfo | null> => {
  const siteName = (await getTranslations({ locale, namespace: 'Site' }))('name');
  if (id.startsWith('topic-')) {
    const topic = id.slice(6);
    if (!isTopicSlug(topic)) return null;
    const content = getTopicContent(topic, locale);
    if (!content) return null;
    const t = await getTranslations({ locale, namespace: 'Topics' });
    return {
      id,
      siteName,
      path: `/topics/${topic}`,
      title: t.markup(topic, topicLabelMarkup),
      description: content.page.data.description,
      language: content.isFallback ? 'en' : locale,
    };
  }
  if (id.startsWith('section-')) {
    const section = getSection(id.slice(8));
    if (!section) return null;
    const t = await getTranslations({ locale, namespace: 'Sections' });
    return {
      id,
      siteName,
      path: `/sections/${section.slug}`,
      title: t(`${section.slug}.title`),
      description: t(`${section.slug}.description`),
      language: locale,
    };
  }
  if (id !== 'home' && id !== 'framework' && id !== 'flashcards') return null;
  const t = await getTranslations({
    locale,
    namespace: id === 'home' ? 'Metadata' : id === 'framework' ? 'Framework' : 'Flashcards',
  });
  return {
    id,
    siteName,
    path: id === 'home' ? '/' : `/${id}`,
    title: t('title'),
    description: t('description'),
    language: locale,
  };
});
