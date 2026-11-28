'use client';

import { useStaticSearch } from 'fumadocs-core/search/client';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { useRouter } from '@/i18n/navigation';

export default function SearchCommand({ onNavigate }: { onNavigate: () => void }) {
  const t = useTranslations('Search');
  const locale = useLocale();
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  // A failed database fetch is cached by the search client; a retry needs a fresh cache key.
  const { search, onSearchChange, data, isLoading, error } = useStaticSearch({
    from: attempt === 0 ? '/api/search' : `/api/search?retry=${attempt}`,
    locale,
    delayMs: 120,
    search: { limit: 12 },
  });
  const results = data?.query === search ? data.items.filter((item) => item.type === 'page') : [];
  return (
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>{t('description')}</DialogDescription>
      </DialogHeader>
      <Command
        label={t('title')}
        shouldFilter={false}
        onKeyDownCapture={(event) => {
          if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229))
            event.stopPropagation();
        }}
      >
        <CommandInput
          aria-label={t('title')}
          placeholder={t('placeholder')}
          value={search}
          onValueChange={onSearchChange}
        />
        <CommandList aria-label={t('results')}>
          {search.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">{t('hint')}</p>
          ) : isLoading ? (
            <p role="status" className="text-muted-foreground p-4 text-sm">
              {t('loading')}
            </p>
          ) : error ? (
            <Empty role="alert">
              <EmptyHeader>
                <EmptyTitle>{t('errorTitle')}</EmptyTitle>
                <EmptyDescription>{t('errorDescription')}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
                  {t('retry')}
                </Button>
              </EmptyContent>
            </Empty>
          ) : results.length === 0 ? (
            <Empty role="status">
              <EmptyHeader>
                <EmptyTitle>{t('empty')}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <CommandGroup heading={t('results')}>
              {results.map(
                (item) =>
                  item.type === 'page' && (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => {
                        onNavigate();
                        router.push(item.url);
                      }}
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span>{item.content}</span>
                        {item.breadcrumbs && (
                          <span className="text-muted-foreground text-xs">{item.breadcrumbs.join(' / ')}</span>
                        )}
                      </span>
                    </CommandItem>
                  ),
              )}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
      <p className="text-muted-foreground text-xs">{t('keyboardHint')}</p>
    </DialogContent>
  );
}
