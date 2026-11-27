import { ArrowLeftIcon, ArrowRightIcon, InfoIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { topicMdxComponents } from '@/components/mdx/mdx-components';
import { topicLabelMarkup, TopicLabel } from '@/components/site/topic-label';
import { TopicProgressControls } from '@/components/topic/topic-progress-controls';
import { Link } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/resolve-locale';
import { routing } from '@/i18n/routing';
import { getTopicContent } from '@/lib/content/topic-source';
import { TOPIC_SLUGS, getAdjacentTopics, getTopicSections, isTopicSlug } from '@/lib/topics/registry';

type Props = {
  params: Promise<{ locale: string; topic: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => TOPIC_SLUGS.map((topic) => ({ locale, topic })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { topic } = await params;
  if (!isTopicSlug(topic)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: 'Topics' });
  return {
    title: t.markup(topic, topicLabelMarkup),
    description: getTopicContent(topic, locale)?.page.data.description,
  };
}

const linkClassName =
  'focus-visible:ring-ring/50 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3';

export default async function TopicPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { topic } = await params;
  if (!isTopicSlug(topic)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations('Topic');
  const tSite = await getTranslations('Site');
  const tSections = await getTranslations('Sections');
  const sections = getTopicSections(topic);
  const primarySection = sections[0];
  const { previous, next } = getAdjacentTopics(topic);
  const content = getTopicContent(topic, locale);
  if (!content) {
    notFound();
  }
  const Body = content.page.data.body;
  const related = content.page.data.related.filter(isTopicSlug);

  return (
    <article className="flex flex-col gap-6">
      <nav aria-label={t('breadcrumb')}>
        <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
          <li>
            <Link href="/" className={linkClassName}>
              {tSite('home')}
            </Link>
          </li>
          {primarySection && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              <Link href={`/sections/${primarySection.slug}`} className={linkClassName}>
                {tSections(`${primarySection.slug}.title`)}
              </Link>
            </li>
          )}
        </ol>
      </nav>

      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">
          <TopicLabel slug={topic} />
        </h1>
        <p lang={content.isFallback ? routing.defaultLocale : undefined} className="text-muted-foreground text-lg">
          {content.page.data.description}
        </p>
        <p className="text-muted-foreground text-sm">
          {t('partOf')}{' '}
          {sections.map((section, index) => (
            <span key={section.slug}>
              {index > 0 && ', '}
              <Link href={`/sections/${section.slug}`} className={`text-foreground ${linkClassName}`}>
                {tSections(`${section.slug}.title`)}
              </Link>
            </span>
          ))}
        </p>
        <TopicProgressControls topic={topic} />
      </header>

      {content.isFallback && (
        <p role="note" className="bg-muted flex max-w-3xl items-start gap-2 rounded-xl p-3 text-sm">
          <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t('translationMissing')}
        </p>
      )}

      <div lang={content.isFallback ? routing.defaultLocale : undefined}>
        <Body components={topicMdxComponents} />
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-topics" className="flex flex-col gap-2">
          <h2 id="related-topics" className="text-base font-semibold">
            {t('related')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/topics/${slug}`}
                  className="bg-muted hover:bg-muted/70 focus-visible:ring-ring/50 inline-flex rounded-full px-3 py-1 text-sm outline-none focus-visible:ring-3"
                >
                  <TopicLabel slug={slug} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label={t('pagination')} className="mt-4 grid max-w-3xl grid-cols-2 gap-3 border-t pt-6">
        {previous ? (
          <Link
            href={`/topics/${previous}`}
            rel="prev"
            className="hover:bg-muted focus-visible:ring-ring/50 flex flex-col gap-1 rounded-xl p-3 outline-none focus-visible:ring-3"
          >
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <ArrowLeftIcon aria-hidden className="size-3.5" />
              {t('previous')}
            </span>
            <span className="text-sm font-medium">
              <TopicLabel slug={previous} />
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/topics/${next}`}
            rel="next"
            className="hover:bg-muted focus-visible:ring-ring/50 flex flex-col items-end gap-1 rounded-xl p-3 text-right outline-none focus-visible:ring-3"
          >
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              {t('next')}
              <ArrowRightIcon aria-hidden className="size-3.5" />
            </span>
            <span className="text-sm font-medium">
              <TopicLabel slug={next} />
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
