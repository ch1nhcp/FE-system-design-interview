import type { Locale } from 'next-intl';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';

import { routing } from '@/i18n/routing';

/**
 * Awaits the route `params`, validates the locale segment, and returns it
 * narrowed to the app's `Locale` union. Renders the 404 page for unknown
 * locales.
 */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return locale;
}
