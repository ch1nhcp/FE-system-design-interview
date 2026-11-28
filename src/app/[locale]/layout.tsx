import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Geist } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { resolveLocale } from '@/i18n/resolve-locale';
import { routing } from '@/i18n/routing';
import { QueryProvider } from '@/lib/query';
import { createPageMetadata } from '@/lib/seo/metadata';
import { getPageInfo } from '@/lib/seo/page-info';

import '../globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
});

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export const dynamic = 'error';
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const tSite = await getTranslations({ locale, namespace: 'Site' });
  const info = await getPageInfo(locale, 'home');
  return {
    ...(info ? createPageMetadata(info, locale) : {}),
    title: { default: t('title'), template: `%s | ${tSite('name')}` },
    description: t('description'),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: Props) {
  const locale = await resolveLocale(params);

  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider>
            <QueryProvider>{children}</QueryProvider>
          </NextIntlClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
