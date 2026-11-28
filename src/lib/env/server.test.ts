// @vitest-environment node

import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('requires a canonical origin before building production metadata', async () => {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('SITE_URL', undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await expect(import('./server')).rejects.toThrow();
});

it('uses a local origin during development', async () => {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('SITE_URL', undefined);
  expect((await import('./server')).serverEnv.SITE_URL).toBe('http://localhost:3000');
});

it.each(['https://study.example/topics', 'https://user:pass@study.example', 'https://study.example?preview=true'])(
  'rejects a non-origin SITE_URL: %s',
  async (value) => {
    vi.resetModules();
    vi.stubEnv('SITE_URL', value);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(import('./server')).rejects.toThrow();
  },
);
