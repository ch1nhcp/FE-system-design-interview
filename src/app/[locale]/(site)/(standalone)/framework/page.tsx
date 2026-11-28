import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { TopicLabel } from '@/components/site/topic-label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { resolveLocale } from '@/i18n/resolve-locale';

const STAGES = [
  { key: 'requirements', letter: 'R', minutes: 5, topics: ['authorization', 'ui-states'] },
  { key: 'architecture', letter: 'A', minutes: 10, topics: ['server-side-rendering', 'composition'] },
  { key: 'data', letter: 'D', minutes: 7, topics: ['normalized-state', 'conflict-resolution'] },
  { key: 'interfaces', letter: 'I', minutes: 8, topics: ['rest', 'event-handlers'] },
  { key: 'optimizations', letter: 'O', minutes: 15, topics: ['core-web-vitals', 'visual-accessibility'] },
] as const;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'Framework' });
  return { title: t('title'), description: t('description') };
}

export default async function FrameworkPage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations('Framework');
  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground max-w-3xl">{t('guideIntro')}</p>
      </header>
      <nav aria-label={t('steps')}>
        <ol className="flex flex-wrap gap-2">
          {STAGES.map((stage) => (
            <li key={stage.key}>
              <a
                href={`#${stage.key}`}
                className="bg-muted focus-visible:ring-ring/50 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-3"
              >
                <strong>{stage.letter}</strong>
                {t(`stages.${stage.key}.title`)}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <section aria-labelledby="radio-pacing" className="flex flex-col gap-2">
        <h2 id="radio-pacing" className="text-lg font-semibold">
          {t('pacing')}
        </h2>
        <p className="text-muted-foreground text-sm">{t('pacingHint')}</p>
      </section>
      {STAGES.map((stage) => (
        <Card key={stage.key} id={stage.key} className="scroll-mt-20">
          <CardHeader>
            <CardTitle>
              <h2>
                {stage.letter}. {t(`stages.${stage.key}.title`)}
              </h2>
            </CardTitle>
            <CardDescription>{t(`stages.${stage.key}.summary`)}</CardDescription>
            <CardAction>
              <Badge variant="secondary">{t('minutes', { count: stage.minutes })}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">{t('deliverableLabel')}</h3>
              <p className="text-sm leading-relaxed">{t(`stages.${stage.key}.deliverable`)}</p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">{t('promptsLabel')}</h3>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
                {(['q1', 'q2', 'q3'] as const).map((q) => (
                  <li key={q}>{t(`stages.${stage.key}.${q}`)}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-x-4 gap-y-2">
            <span className="text-muted-foreground text-xs">{t('readMore')}</span>
            {stage.topics.map((topic) => (
              <Link
                key={topic}
                href={`/topics/${topic}`}
                className="focus-visible:ring-ring/50 rounded-sm text-sm underline underline-offset-4 outline-none focus-visible:ring-3"
              >
                <TopicLabel slug={topic} />
              </Link>
            ))}
          </CardFooter>
        </Card>
      ))}
      <p className="text-sm leading-relaxed">{t('closing')}</p>
      <a
        href="https://www.greatfrontend.com/front-end-system-design-playbook/framework"
        target="_blank"
        rel="noreferrer"
        className="focus-visible:ring-ring/50 w-fit rounded-sm text-sm underline underline-offset-4 outline-none focus-visible:ring-3"
      >
        {t('source')}
      </a>
    </article>
  );
}
