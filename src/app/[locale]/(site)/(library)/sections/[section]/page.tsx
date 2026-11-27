import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { topicMdxComponents } from '@/components/mdx/mdx-components';
import { SectionTopicList } from '@/components/section/section-topic-list';
import { resolveLocale } from '@/i18n/resolve-locale';
import { routing } from '@/i18n/routing';
import { getSectionOverview, getTopicContent } from '@/lib/content/topic-source';
import { SECTIONS, getSection } from '@/lib/topics/registry';
import type { TopicSlug } from '@/lib/topics/registry';

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
  const t = await getTranslations({ locale, namespace: 'Sections' });
  return { title: t(`${section.slug}.title`), description: t(`${section.slug}.description`) };
}

export default async function SectionPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const section = getSection((await params).section);
  if (!section) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations('Sections');
  const summaries: Partial<Record<TopicSlug, string>> = Object.fromEntries(
    section.topics.flatMap((topic: TopicSlug) => {
      const summary = getTopicContent(topic, locale)?.page.data.description;
      return summary ? [[topic, summary]] : [];
    }),
  );

  const Overview = getSectionOverview(section.slug, locale)?.data.body;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t(`${section.slug}.title`)}</h1>
        <p className="text-muted-foreground">{t(`${section.slug}.description`)}</p>
      </header>
      <SectionTopicList section={section} summaries={summaries} />
      {Overview && <Overview components={topicMdxComponents} />}
    </div>
  );
}
