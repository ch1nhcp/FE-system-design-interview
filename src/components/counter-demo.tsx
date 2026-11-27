'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCounterStore } from '@/stores/use-counter-store';

export function CounterDemo() {
  const t = useTranslations('Counter');
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);
  const reset = useCounterStore((state) => state.reset);

  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>{t('label')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-semibold tabular-nums">{count}</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={decrement}>
          {t('decrement')}
        </Button>
        <Button size="sm" onClick={increment}>
          {t('increment')}
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          {t('reset')}
        </Button>
      </CardFooter>
    </Card>
  );
}
