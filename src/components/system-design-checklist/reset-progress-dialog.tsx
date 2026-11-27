'use client';

import { RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useChecklistStore } from '@/stores/use-checklist-store';

type Props = {
  disabled: boolean;
};

export function ResetProgressDialog({ disabled }: Props) {
  const t = useTranslations('Checklist');
  const reset = useChecklistStore((state) => state.reset);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <RotateCcwIcon aria-hidden />
          {t('reset')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('resetTitle')}</DialogTitle>
          <DialogDescription>{t('resetDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('resetCancel')}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" onClick={reset}>
              {t('resetConfirm')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
