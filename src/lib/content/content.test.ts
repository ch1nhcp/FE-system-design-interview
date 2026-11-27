import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { routing } from '@/i18n/routing';
import { isTopicSlug } from '@/lib/topics/registry';

import { topicFrontmatterSchema } from './topic-frontmatter';

const CONTENT_DIR = path.join(process.cwd(), 'content/topics');
const FILE_NAME = /^(?<slug>[a-z0-9-]+?)(?:\.(?<locale>[a-z]{2}))?\.mdx$/;

const files = readdirSync(CONTENT_DIR);

function parseFrontmatter(source: string): unknown {
  const match = /^---\n(?<yaml>[\s\S]*?)\n---\n/.exec(source);
  return match?.groups?.yaml ? parse(match.groups.yaml) : undefined;
}

describe.each(files)('content/topics/%s', (file) => {
  const match = FILE_NAME.exec(file);
  const source = readFileSync(path.join(CONTENT_DIR, file), 'utf8');

  it('is named <topic>.mdx or <topic>.<locale>.mdx for a known topic and locale', () => {
    expect(match, 'file name').not.toBeNull();
    expect(isTopicSlug(match?.groups?.slug ?? ''), 'topic slug in the registry').toBe(true);

    const locale = match?.groups?.locale;
    if (locale) {
      expect(locale).not.toBe(routing.defaultLocale);
      expect(routing.locales).toContain(locale);
    }
  });

  it('has a translation only when the English file exists', () => {
    if (match?.groups?.locale) {
      expect(files).toContain(`${match.groups.slug}.mdx`);
    }
  });

  it('has valid frontmatter', () => {
    const result = topicFrontmatterSchema.safeParse(parseFrontmatter(source));

    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('never uses an em dash', () => {
    expect(source).not.toContain(String.fromCodePoint(0x20_14));
  });
});
