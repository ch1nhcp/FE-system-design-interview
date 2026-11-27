import { setRequestLocale } from 'next-intl/server';

import { Dashboard } from '@/components/dashboard/dashboard';
import { resolveLocale } from '@/i18n/resolve-locale';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  return <Dashboard />;
}
