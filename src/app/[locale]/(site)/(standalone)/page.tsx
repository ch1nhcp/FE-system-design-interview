import { setRequestLocale } from 'next-intl/server';

import { Dashboard } from '@/components/dashboard/dashboard';
import { PageStructuredData } from '@/components/site/page-structured-data';
import { resolveLocale } from '@/i18n/resolve-locale';
import { getPageInfo } from '@/lib/seo/page-info';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  return (
    <>
      <PageStructuredData info={await getPageInfo(locale, 'home')} locale={locale} />
      <Dashboard />
    </>
  );
}
