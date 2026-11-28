import { setRequestLocale } from 'next-intl/server';

import { MAIN_CONTENT_ID, NAV_SCROLL_CONTAINER_ATTRIBUTE } from '@/components/site/constants';
import { SectionsNav } from '@/components/site/sections-nav';
import { resolveLocale } from '@/i18n/resolve-locale';

export default async function LibraryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(await resolveLocale(params));
  return (
    <div className="@container/library mx-auto flex w-full max-w-7xl gap-10 px-4">
      <aside
        {...{ [NAV_SCROLL_CONTAINER_ATTRIBUTE]: '' }}
        className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto py-8 @min-[64rem]/library:block"
      >
        <SectionsNav />
      </aside>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="@container/topic min-w-0 flex-1 py-8 outline-none sm:py-10">
        {children}
      </main>
    </div>
  );
}
