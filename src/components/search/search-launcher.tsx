'use client';

import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { lazy, Suspense, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const SearchCommand = lazy(() => import('./search-command'));

export function SearchLauncher() {
  const t = useTranslations('Search');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" aria-label={t('title')}>
          <SearchIcon aria-hidden data-icon="inline-start" />
          <span className="hidden md:inline">{t('title')}</span>
          <kbd aria-hidden className="text-muted-foreground hidden text-xs lg:inline">
            ⌘ / Ctrl K
          </kbd>
        </Button>
      </DialogTrigger>
      {open && (
        <Suspense
          fallback={
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('title')}</DialogTitle>
                <DialogDescription>{t('loading')}</DialogDescription>
              </DialogHeader>
            </DialogContent>
          }
        >
          <SearchCommand onNavigate={() => setOpen(false)} />
        </Suspense>
      )}
    </Dialog>
  );
}
