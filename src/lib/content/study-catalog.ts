import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';

import { topicLabelMarkup } from '@/components/site/topic-label';
import { TOPIC_SLUGS, getTopicSections } from '@/lib/topics/registry';

import { extractFlashcards } from './flashcards';
import { getTopicContent } from './topic-source';

/** Build-time catalog shared by search and flashcards, always derived from the authored MDX. */
export const getStudyCatalog = cache(async (locale: Locale) => {
  const t = await getTranslations({ locale, namespace: 'Topics' });
  return Promise.all(
    TOPIC_SLUGS.map(async (topic) => {
      const content = getTopicContent(topic, locale);
      if (!content) throw new Error(`Missing study content: ${locale}/${topic}`);
      const cards = extractFlashcards(topic, await content.page.data.getMDAST());
      if (cards.length < 2) throw new Error(`Missing interview questions: ${locale}/${topic}`);
      const structure = content.page.data.structuredData;
      return {
        topic,
        title: t.markup(topic, topicLabelMarkup),
        description: content.page.data.description,
        sections: getTopicSections(topic).map(({ slug }) => slug),
        contentLanguage: content.isFallback ? 'en' : locale,
        cards,
        searchText: [
          ...structure.headings.map(({ content }) => content),
          ...structure.contents.map(({ content }) => content),
          ...cards.map(({ question }) => question),
        ].join('\n'),
      };
    }),
  );
});
