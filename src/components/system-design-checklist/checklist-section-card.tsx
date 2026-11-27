'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useChecklistStore } from '@/stores/use-checklist-store';

import type { ChecklistSection } from './checklist-data';
import { countCheckedInSection, getChecklistItemKey } from './checklist-data';

const richTags = {
  code: (chunks: ReactNode) => (
    <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.8125rem]">{chunks}</code>
  ),
};

type Props = {
  section: ChecklistSection;
};

export function ChecklistSectionCard({ section }: Props) {
  const t = useTranslations('Checklist');
  const checked = useChecklistStore((state) => state.checked);
  const setChecked = useChecklistStore((state) => state.setChecked);

  const headingId = `checklist-${section.id}`;
  const done = countCheckedInSection(section, checked);
  const total = section.items.length;

  return (
    <Card size="sm" className="mb-3 break-inside-avoid">
      <CardHeader>
        <CardTitle>
          <h2 id={headingId}>{t(`sections.${section.id}`)}</h2>
        </CardTitle>
        <CardAction>
          <Badge variant={done === total ? 'default' : 'secondary'} className="tabular-nums">
            {done}/{total}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul aria-labelledby={headingId} className="flex flex-col gap-2.5">
          {section.items.map((itemId) => {
            const key = getChecklistItemKey(section.id, itemId);
            const inputId = `checklist-item-${section.id}-${itemId}`;

            return (
              <li key={itemId} className="flex items-start gap-2.5">
                <Checkbox
                  id={inputId}
                  className="mt-0.5"
                  checked={checked[key] === true}
                  onCheckedChange={(value) => setChecked(key, value === true)}
                />
                <Label
                  htmlFor={inputId}
                  className="peer-data-checked:text-muted-foreground block leading-snug font-normal peer-data-checked:line-through"
                >
                  {t.rich(`items.${itemId}`, richTags)}
                </Label>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
