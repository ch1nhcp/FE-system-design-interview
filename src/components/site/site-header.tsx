import { useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/components/locale-switcher';
import { SearchLauncher } from '@/components/search/search-launcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Link } from '@/i18n/navigation';

import { MainNavLinks } from './main-nav-links';
import { MobileNav } from './mobile-nav';

export function SiteHeader() {
  const t = useTranslations('Site');

  return (
    <header className="bg-background/90 supports-backdrop-filter:bg-background/75 sticky top-0 z-40 border-b backdrop-blur">
      <div className="@container/site-header mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:gap-4">
        <MobileNav />
        <Link
          href="/"
          className="focus-visible:ring-ring/50 min-w-0 truncate rounded-md text-sm font-semibold outline-none focus-visible:ring-3"
        >
          {t('name')}
        </Link>
        <MainNavLinks className="hidden @min-[40rem]/site-header:block" />
        <div className="ml-auto flex items-center gap-2">
          <SearchLauncher />
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
