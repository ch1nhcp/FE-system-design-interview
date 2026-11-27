import { CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

const featureKeys = [
  'i18nRouting',
  'envValidation',
  'linting',
  'commits',
  'csp',
  'renovate',
  'pathAlias',
  'redirects',
] as const;

export function FeatureList() {
  const t = useTranslations('Features');

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">{t('title')}</h2>
      <ul className="flex flex-col gap-2">
        {featureKeys.map((key) => (
          <li key={key} className="flex items-center gap-2">
            <CheckIcon aria-hidden className="text-muted-foreground size-4 shrink-0" />
            {t(key)}
          </li>
        ))}
      </ul>
    </section>
  );
}
