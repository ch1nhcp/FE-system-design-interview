'use client';

import { CheckIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { Link, usePathname } from '@/i18n/navigation';
import { SECTIONS } from '@/lib/topics/registry';
import type { TopicSlug } from '@/lib/topics/registry';
import { cn } from '@/lib/utils';
import { useProgressStore } from '@/stores/use-progress-store';
import type { TopicStatus } from '@/stores/use-progress-store';

import { NAV_SCROLL_CONTAINER_ATTRIBUTE } from './constants';
import { TopicLabel } from './topic-label';

type Props = {
  /** Called after a link is followed, e.g. to close the mobile drawer. */
  onNavigate?: () => void;
};

function StatusIcon({ status }: { status: TopicStatus | undefined }) {
  const t = useTranslations('Topic');

  if (status === 'learned') {
    return (
      <span className="text-muted-foreground ml-auto shrink-0">
        <CheckIcon aria-hidden className="size-3.5" />
        <span className="sr-only">({t('learned')})</span>
      </span>
    );
  }
  if (status === 'review') {
    return (
      <span className="text-muted-foreground ml-auto shrink-0">
        <RotateCcwIcon aria-hidden className="size-3.5" />
        <span className="sr-only">({t('reviewAgain')})</span>
      </span>
    );
  }
  return null;
}

const linkClassName =
  'hover:text-foreground focus-visible:ring-ring/50 flex items-center gap-2 rounded-md px-2 py-1 outline-none focus-visible:ring-3 aria-[current=page]:bg-muted aria-[current=page]:text-foreground';

export function SectionsNav({ onNavigate }: Props) {
  const t = useTranslations('Sections');
  const tSite = useTranslations('Site');
  const pathname = usePathname();
  const topics = useProgressStore((state) => state.topics);
  const navRef = useRef<HTMLElement>(null);

  // Keep the current page visible in a long nav. Only the nav's own scroll container moves, never the page.
  useEffect(() => {
    const nav = navRef.current;
    const container = nav?.closest(`[${NAV_SCROLL_CONTAINER_ATTRIBUTE}]`);
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!container || !active) {
      return;
    }
    const activeTop = active.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTop = activeTop - container.clientHeight / 3;
  }, [pathname]);

  const currentProps = (href: string) => (pathname === href ? ({ 'aria-current': 'page' } as const) : {});

  return (
    <nav ref={navRef} aria-label={tSite('sectionsNavigation')} className="text-sm">
      <ul className="flex flex-col gap-4">
        {SECTIONS.map((section) => {
          const sectionHref = `/sections/${section.slug}`;
          return (
            <li key={section.slug} className="flex flex-col gap-1">
              <Link
                href={sectionHref}
                onClick={onNavigate}
                className={cn(linkClassName, 'text-foreground font-medium')}
                {...currentProps(sectionHref)}
              >
                {t(`${section.slug}.title`)}
              </Link>
              <ul className="border-border ml-2 flex flex-col border-l pl-2">
                {section.topics.map((topic: TopicSlug) => {
                  const topicHref = `/topics/${topic}`;
                  return (
                    <li key={topic}>
                      <Link
                        href={topicHref}
                        onClick={onNavigate}
                        className={cn(linkClassName, 'text-muted-foreground')}
                        {...currentProps(topicHref)}
                      >
                        <span className="min-w-0">
                          <TopicLabel slug={topic} />
                        </span>
                        {/* Separates the label from the status in the link's accessible name. */}{' '}
                        <StatusIcon status={topics[topic]} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
