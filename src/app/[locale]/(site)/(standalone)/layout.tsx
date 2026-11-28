import { setRequestLocale } from 'next-intl/server';

import { MAIN_CONTENT_ID } from '@/components/site/constants';
import { resolveLocale } from '@/i18n/resolve-locale';

export default async function StandaloneLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(await resolveLocale(params));
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 py-8 outline-none sm:py-10">
      {children}
    </main>
  );
}
