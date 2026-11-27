import { useTranslations } from 'next-intl';

import { MAIN_CONTENT_ID } from '@/components/site/constants';
import { ProgressHydrator } from '@/components/site/progress-hydrator';
import { SiteHeader } from '@/components/site/site-header';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Site');

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="bg-background focus-visible:ring-ring/50 sr-only z-50 rounded-md px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus-visible:ring-3"
      >
        {t('skipToContent')}
      </a>
      <ProgressHydrator />
      <SiteHeader />
      {children}
    </div>
  );
}
