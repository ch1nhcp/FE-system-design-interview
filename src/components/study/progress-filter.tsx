'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { Field, FieldTitle } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type ProgressFilterValue = 'all' | 'review';

export function ProgressFilter({
  value,
  onChange,
}: {
  value: ProgressFilterValue;
  onChange: (value: ProgressFilterValue) => void;
}) {
  const t = useTranslations('Study');
  const labelId = useId();
  return (
    <Field>
      <FieldTitle id={labelId}>{t('status')}</FieldTitle>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        aria-labelledby={labelId}
        value={value}
        onValueChange={(next) => {
          if (next === 'all' || next === 'review') onChange(next);
        }}
      >
        <ToggleGroupItem value="all">{t('all')}</ToggleGroupItem>
        <ToggleGroupItem value="review">{t('review')}</ToggleGroupItem>
      </ToggleGroup>
    </Field>
  );
}
