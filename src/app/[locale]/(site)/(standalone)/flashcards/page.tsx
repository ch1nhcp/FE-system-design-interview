import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { resolveLocale } from '@/i18n/resolve-locale';

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

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted-foreground max-w-2xl">{t('description')}</p>
      <p className="bg-muted mt-4 rounded-xl p-4 text-sm">{t('comingSoon')}</p>
    </div>
  );
}
