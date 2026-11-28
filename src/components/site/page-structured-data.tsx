import type { Locale } from 'next-intl';

import { createPageSchema, serializeJsonLd } from '@/lib/seo/metadata';
import type { PageInfo } from '@/lib/seo/metadata';

export function PageStructuredData({ info, locale }: { info: PageInfo | null; locale: Locale }) {
  if (!info) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(createPageSchema(info, locale)) }}
    />
  );
}
