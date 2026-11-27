import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { RealtimeTransportAnimation } from '@/components/visuals/realtime-transport/realtime-transport-animation';
import { resolveLocale } from '@/i18n/resolve-locale';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Development-only playground for visual components.
 * Remove once topic pages exist (Phase 2).
 */
export default async function LabPage({ params }: Props) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10">
      <section className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Visual panel width (about 420px)</h1>
        <div className="max-w-[420px]">
          <RealtimeTransportAnimation />
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Mobile width (343px)</h2>
        <div className="max-w-[343px]">
          <RealtimeTransportAnimation initialMode="webSocket" />
        </div>
      </section>
    </main>
  );
}
