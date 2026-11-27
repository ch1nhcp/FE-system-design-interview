import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';

import { CounterDemo } from '@/components/counter-demo';
import { FeatureList } from '@/components/feature-list';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { TechStack } from '@/components/tech-stack';
import { ThemeToggle } from '@/components/theme-toggle';
import { UiShowcase } from '@/components/ui-showcase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveLocale } from '@/i18n/resolve-locale';

const AUTHOR_URL = 'https://ch1nhcp.dev';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const locale = await resolveLocale(params);

  setRequestLocale(locale);

  const t = await getTranslations('HomePage');

  return (
    <div className="relative flex min-h-screen flex-col items-center p-8">
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 pt-16 pb-8">
        <Image src="/next.svg" alt={t('logoAlt')} width={100} height={20} priority />
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground max-w-md">{t('description')}</p>
        </div>
        <Tabs defaultValue="overview" className="w-full gap-6">
          <TabsList className="mx-auto">
            <TabsTrigger value="overview" className="px-4">
              {t('tabOverview')}
            </TabsTrigger>
            <TabsTrigger value="components" className="px-4">
              {t('tabComponents')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="flex flex-col gap-8">
            <TechStack />
            <FeatureList />
          </TabsContent>
          <TabsContent value="components" className="flex flex-col items-center gap-8">
            <CounterDemo />
            <UiShowcase />
          </TabsContent>
        </Tabs>
        <a
          className="hover:text-foreground text-sm underline underline-offset-4"
          href={AUTHOR_URL}
          target="_blank"
          rel="noreferrer"
        >
          {t('createdBy')}
        </a>
      </main>
    </div>
  );
}
