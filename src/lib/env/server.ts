import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const serverEnv = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    SITE_URL: z.preprocess(
      (value) => value ?? (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000'),
      z.url().refine((value) => {
        const url = new URL(value);
        return (
          ['http:', 'https:'].includes(url.protocol) &&
          url.pathname === '/' &&
          !url.search &&
          !url.hash &&
          !url.username &&
          !url.password
        );
      }, 'SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment'),
    ),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: { SITE_URL: process.env.SITE_URL },
});
