'use client';

import { Languages } from 'lucide-react';
import type { Locale } from 'next-intl';
import { hasLocale, useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  vi: 'VI',
};

export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(value: string) {
    if (!hasLocale(routing.locales, value)) {
      return;
    }

    // Read at click time so the static page needs no Suspense boundary,
    // and the hash survives too (useSearchParams can't see it).
    const { search, hash } = window.location;
    router.replace(`${pathname}${search}${hash}`, { locale: value });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">{t('label')}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Languages data-icon="inline-start" />
            {localeLabels[activeLocale]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={activeLocale} onValueChange={switchLocale}>
            {routing.locales.map((locale) => (
              <DropdownMenuRadioItem key={locale} value={locale}>
                {localeLabels[locale]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
