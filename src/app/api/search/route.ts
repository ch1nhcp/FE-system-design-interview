import { createI18nSearchAPI } from 'fumadocs-core/search/server';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { getStudyCatalog } from '@/lib/content/study-catalog';

export const dynamic = 'force-static';

const search = createI18nSearchAPI('simple', {
  i18n: { languages: [...routing.locales], defaultLanguage: routing.defaultLocale },
  indexes: async () =>
    (
      await Promise.all(
        routing.locales.map(async (locale) => {
          const t = await getTranslations({ locale, namespace: 'Sections' });
          return (await getStudyCatalog(locale)).map((topic) => ({
            title: topic.title,
            description: topic.description,
            content: topic.searchText,
            url: `/topics/${topic.topic}`,
            locale,
            breadcrumbs: topic.sections.map((section) => t(`${section}.title`)),
          }));
        }),
      )
    ).flat(),
});

export const GET = search.staticGET;
