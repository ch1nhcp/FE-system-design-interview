import type { Metadata } from 'next';
import type { Locale } from 'next-intl';

import { routing } from '@/i18n/routing';
import { serverEnv } from '@/lib/env/server';
import { SECTIONS, TOPIC_SLUGS } from '@/lib/topics/registry';

export type PageInfo = {
  id: string;
  path: string;
  title: string;
  description: string;
  language: Locale;
  siteName: string;
};

export const siteUrl = new URL(serverEnv.SITE_URL);

export function localePath(path: string, locale: Locale) {
  return locale === routing.defaultLocale ? path : `/${locale}${path === '/' ? '' : path}`;
}

export function getPublicPages() {
  return [
    { id: 'home', path: '/' },
    { id: 'framework', path: '/framework' },
    { id: 'flashcards', path: '/flashcards' },
    ...SECTIONS.map(({ slug }) => ({ id: `section-${slug}`, path: `/sections/${slug}` })),
    ...TOPIC_SLUGS.map((slug) => ({ id: `topic-${slug}`, path: `/topics/${slug}` })),
  ];
}

export function pageUrl(path: string, locale: Locale) {
  return new URL(localePath(path, locale), siteUrl).href;
}

export function createPageMetadata(info: PageInfo, locale: Locale): Metadata {
  const canonical = pageUrl(info.path, locale);
  const image = { url: new URL(`/og/${locale}/${info.id}`, siteUrl).href, width: 1200, height: 630, alt: info.title };
  return {
    title: info.title,
    description: info.description,
    metadataBase: siteUrl,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(routing.locales.map((language) => [language, pageUrl(info.path, language)])),
        'x-default': pageUrl(info.path, routing.defaultLocale),
      },
    },
    openGraph: {
      type: 'website',
      title: info.title,
      description: info.description,
      siteName: info.siteName,
      url: canonical,
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      alternateLocale: [locale === 'vi' ? 'en_US' : 'vi_VN'],
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: info.title, description: info.description, images: [image] },
  };
}

export function createPageSchema(info: PageInfo, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': info.id.startsWith('topic-')
      ? 'LearningResource'
      : info.id.startsWith('section-')
        ? 'CollectionPage'
        : 'WebPage',
    name: info.title,
    description: info.description,
    inLanguage: info.language,
    url: pageUrl(info.path, locale),
    isPartOf: { '@type': 'WebSite', '@id': `${siteUrl.href}#website`, name: info.siteName, url: siteUrl.href },
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
