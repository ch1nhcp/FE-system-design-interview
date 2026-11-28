import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { topicMdxComponents } from '@/components/mdx/mdx-components';
import { SectionTopicList } from '@/components/section/section-topic-list';
import { PageStructuredData } from '@/components/site/page-structured-data';
import { resolveLocale } from '@/i18n/resolve-locale';
import { routing } from '@/i18n/routing';
import { getSectionOverview, getTopicContent } from '@/lib/content/topic-source';
import { createPageMetadata } from '@/lib/seo/metadata';
import { getPageInfo } from '@/lib/seo/page-info';
import { SECTIONS, getSection } from '@/lib/topics/registry';

type Props = {
  params: Promise<{ locale: string; section: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => SECTIONS.map((section) => ({ locale, section: section.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const section = getSection((await params).section);
  if (!section) {
    return {};
  }
  const info = await getPageInfo(locale, `section-${section.slug}`);
  return info ? createPageMetadata(info, locale) : {};
}

export default async function SectionPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const section = getSection((await params).section);
  if (!section) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations('Sections');
  const topics = section.topics.map((topic) => {
    const content = getTopicContent(topic, locale);
    if (!content) {
      notFound();
    }
    return { topic, summary: content.page.data.description };
  });

  const Overview = getSectionOverview(section.slug, locale)?.data.body;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageStructuredData info={await getPageInfo(locale, `section-${section.slug}`)} locale={locale} />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t(`${section.slug}.title`)}</h1>
        <p className="text-muted-foreground">{t(`${section.slug}.description`)}</p>
      </header>
      <SectionTopicList topics={topics} />
      {Overview && <Overview components={topicMdxComponents} />}
    </div>
  );
}
