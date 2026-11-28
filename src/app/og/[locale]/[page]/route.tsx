import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ImageResponse } from 'next/og';

import { routing } from '@/i18n/routing';
import { getPublicPages } from '@/lib/seo/metadata';
import { getPageInfo } from '@/lib/seo/page-info';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getPublicPages().map(({ id }) => ({ locale, page: id })));
}

const font = readFile(path.join(process.cwd(), 'src/assets/fonts/IBMPlexSans-Regular.ttf'));

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; page: string }> }) {
  const { locale, page } = await params;
  if (!hasLocale(routing.locales, locale)) return new Response('Not found', { status: 404 });
  const info = await getPageInfo(locale, page);
  if (!info) return new Response('Not found', { status: 404 });
  const t = await getTranslations({ locale, namespace: 'OpenGraph' });
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '56px 64px',
        background: '#0a0a0a',
        color: '#fafafa',
        fontFamily: 'IBM Plex Sans',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 24,
          color: '#a3a3a3',
        }}
      >
        <span>{info.siteName}</span>
        <span>{locale.toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', fontSize: 18, letterSpacing: 3, color: '#a3a3a3' }}>{t('eyebrow')}</div>
        <div
          style={{ display: 'flex', fontSize: info.title.length > 60 ? 48 : 64, lineHeight: 1.12, letterSpacing: -2 }}
        >
          {info.title}
        </div>
        <div style={{ display: 'flex', fontSize: 25, lineHeight: 1.4, color: '#d4d4d4' }}>{info.description}</div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #404040',
          paddingTop: 20,
          fontSize: 20,
          color: '#a3a3a3',
        }}
      >
        <span>{t('stats')}</span>
        <span>{t('footer')}</span>
      </div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: 'IBM Plex Sans', data: await font, weight: 400, style: 'normal' }] },
  );
}
