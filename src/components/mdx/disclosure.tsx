import { ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DisclosureProps = {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  summaryClassName?: string;
};

/** Native `<details>`: works without JavaScript and with find-in-page. */
function Disclosure({ summary, children, className, summaryClassName }: DisclosureProps) {
  return (
    <details className={cn('group/disclosure', className)}>
      <summary
        className={cn(
          'focus-visible:ring-ring/50 flex cursor-pointer list-none items-start gap-2 rounded-md outline-none focus-visible:ring-3 [&::-webkit-details-marker]:hidden',
          summaryClassName,
        )}
      >
        <ChevronRightIcon
          aria-hidden
          className="text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-open/disclosure:rotate-90"
        />
        <span className="min-w-0">{summary}</span>
      </summary>
      {children}
    </details>
  );
}

/** A question with its answer folded away, so readers can try to answer first. */
export function InterviewQuestion({ question, children }: { question: string; children: ReactNode }) {
  return (
    <Disclosure summary={question} className="ring-foreground/10 rounded-xl p-3 ring-1" summaryClassName="font-medium">
      <div className="mt-2 pl-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
    </Disclosure>
  );
}

/** Everything beyond the one-screen cheatsheet, collapsed by default. */
export function DeepDive({ children }: { children: ReactNode }) {
  const t = useTranslations('Topic');

  return (
    <Disclosure summary={t('deepDive')} className="border-t pt-4" summaryClassName="text-lg font-semibold">
      <div className="mt-2 [&>*:first-child]:mt-2">{children}</div>
    </Disclosure>
  );
}
