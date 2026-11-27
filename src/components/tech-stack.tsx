import { useTranslations } from 'next-intl';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const techs = [
  { name: 'Next.js 16', key: 'nextjs' },
  { name: 'React 19', key: 'react' },
  { name: 'TypeScript', key: 'typescript' },
  { name: 'Tailwind CSS v4', key: 'tailwind' },
  { name: 'shadcn/ui', key: 'shadcn' },
  { name: 'next-intl', key: 'nextIntl' },
  { name: 'Zustand', key: 'zustand' },
  { name: 'TanStack Query', key: 'tanstackQuery' },
  { name: 'React Hook Form', key: 'reactHookForm' },
  { name: 'Zod', key: 'zod' },
  { name: 'T3 Env', key: 't3env' },
  { name: 'next-themes', key: 'nextThemes' },
  { name: 'Sonner', key: 'sonner' },
  { name: 'Lucide Icons', key: 'lucide' },
] as const;

export function TechStack() {
  const t = useTranslations('TechStack');

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">{t('title')}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {techs.map((tech) => (
          <Card key={tech.key} size="sm">
            <CardHeader>
              <CardTitle>{tech.name}</CardTitle>
              <CardDescription>{t(tech.key)}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
