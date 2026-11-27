import { setRequestLocale } from 'next-intl/server';

import { LocaleSwitcher } from '@/components/locale-switcher';
import { SystemDesignChecklist } from '@/components/system-design-checklist/system-design-checklist';
import { ThemeToggle } from '@/components/theme-toggle';
import { resolveLocale } from '@/i18n/resolve-locale';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const locale = await resolveLocale(params);

  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-6 sm:px-8">
      <div className="flex w-full max-w-3xl justify-end gap-2">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      <main className="w-full max-w-3xl pt-8 pb-8">
        <SystemDesignChecklist />
      </main>
    </div>
  );
}
