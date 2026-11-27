import type { Redirect } from 'next/dist/lib/load-custom-routes';

export const redirects: Redirect[] = [
  {
    source: '/index',
    destination: '/',
    permanent: true,
  },
  {
    source: '/ja/index',
    destination: '/ja',
    permanent: true,
  },
];
