import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FlashcardDeck } from '@/components/study/flashcard-deck';
import { resolveLocale } from '@/i18n/resolve-locale';
import { getStudyCatalog } from '@/lib/content/study-catalog';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'Flashcards' });
  return { title: t('title'), description: t('description') };
}

export default async function FlashcardsPage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations('Flashcards');
  const topics = (await getStudyCatalog(locale)).map(
    ({ topic, title, description, sections, contentLanguage, cards }) => ({
      topic,
      title,
      description,
      sections,
      contentLanguage,
      cards,
    }),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground max-w-2xl">{t('description')}</p>
      </header>
      <FlashcardDeck topics={topics} />
    </div>
  );
}
