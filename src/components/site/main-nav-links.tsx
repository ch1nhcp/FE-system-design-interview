'use client';

import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/framework', key: 'framework' },
  { href: '/flashcards', key: 'flashcards' },
] as const;

type Props = {
  className?: string;
  onNavigate?: () => void;
};

export function MainNavLinks({ className, onNavigate }: Props) {
  const t = useTranslations('Site');
  const pathname = usePathname();

  return (
    <nav aria-label={t('mainNavigation')} className={className}>
      <ul className="flex gap-1">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={cn(
                'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3',
                'aria-[current=page]:text-foreground aria-[current=page]:font-medium',
              )}
            >
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
