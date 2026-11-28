import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { vi } from 'vitest';

/**
 * Stand-in for `@/i18n/navigation` in unit tests, where there is no Next.js router.
 * Use with `vi.mock('@/i18n/navigation', () => import('@/test/mock-navigation'))`.
 */
export const navigationState = { pathname: '/' };

export function Link({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

export const usePathname = () => navigationState.pathname;

export const replace = vi.fn();
export const push = vi.fn();
export const useRouter = () => ({ replace, push });
