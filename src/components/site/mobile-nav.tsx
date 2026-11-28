'use client';

import { MenuIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

import { NAV_SCROLL_CONTAINER_ATTRIBUTE } from './constants';
import { MainNavLinks } from './main-nav-links';
import { SectionsNav } from './sections-nav';

export function MobileNav() {
  const t = useTranslations('Site');
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('openMenu')} className="@min-[64rem]/site-header:hidden">
          <MenuIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0" aria-describedby={undefined}>
        <SheetHeader className="border-b">
          <SheetTitle>{t('name')}</SheetTitle>
        </SheetHeader>
        <div {...{ [NAV_SCROLL_CONTAINER_ATTRIBUTE]: '' }} className="flex flex-col gap-4 overflow-y-auto p-4">
          <MainNavLinks onNavigate={close} className="-ml-2.5" />
          <SectionsNav onNavigate={close} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
