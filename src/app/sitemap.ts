import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';
import { getPublicPages, pageUrl } from '@/lib/seo/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  return getPublicPages().flatMap(({ path }) =>
    routing.locales.map((locale) => ({
      url: pageUrl(path, locale),
      alternates: {
        languages: Object.fromEntries(routing.locales.map((language) => [language, pageUrl(path, language)])),
      },
    })),
  );
}
