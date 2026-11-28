import { describe, expect, it } from 'vitest';

import { createPageMetadata, createPageSchema, getPublicPages, localePath, serializeJsonLd } from './metadata';

describe('public discovery metadata', () => {
  it('publishes one canonical URL per language and reciprocal language alternatives', () => {
    const info = {
      id: 'topic-websockets',
      siteName: 'FE System Design',
      path: '/topics/websockets',
      title: 'WebSockets',
      description: 'A two-way connection.',
      language: 'en',
    } as const;
    const en = createPageMetadata(info, 'en');
    const vi = createPageMetadata(info, 'vi');
    expect(new URL(String(en.alternates?.canonical)).pathname).toBe('/topics/websockets');
    expect(new URL(String(vi.alternates?.canonical)).pathname).toBe('/vi/topics/websockets');
    expect(en.alternates?.languages).toEqual(vi.alternates?.languages);
    expect(vi.openGraph).toMatchObject({ title: 'WebSockets', locale: 'vi_VN', alternateLocale: ['en_US'] });
  });

  it('lists exactly 98 unique pages in each locale without an English prefix', () => {
    const pages = getPublicPages();
    expect(pages).toHaveLength(98);
    expect(new Set(pages.map(({ path }) => path)).size).toBe(98);
    expect(localePath('/', 'en')).toBe('/');
    expect(localePath('/', 'vi')).toBe('/vi');
    expect(pages).toContainEqual({ id: 'section-security', path: '/sections/security' });
    expect(pages).toContainEqual({ id: 'topic-infinite-scrolling', path: '/topics/infinite-scrolling' });
  });

  it('describes the actual lesson language and safely embeds authored text in JSON-LD', () => {
    const schema = createPageSchema(
      {
        id: 'topic-xss',
        siteName: 'FE System Design',
        path: '/topics/xss',
        title: 'XSS </script><script>alert(1)</script>',
        description: 'Prevent injection.',
        language: 'en',
      },
      'vi',
    );
    expect(schema).toMatchObject({ '@type': 'LearningResource', inLanguage: 'en' });
    expect(new URL(schema.url).pathname).toBe('/vi/topics/xss');
    const serialized = serializeJsonLd(schema);
    expect(serialized).not.toContain('</script>');
    expect(JSON.parse(serialized)).toEqual(schema);
  });
});
// @vitest-environment node
