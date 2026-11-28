import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { routing } from '@/i18n/routing';
import { SECTIONS, getSection, isSectionSlug, isTopicSlug } from '@/lib/topics/registry';

import { topicFrontmatterSchema } from './topic-frontmatter';

const TOPICS_DIR = path.join(process.cwd(), 'content/topics');
const SECTIONS_DIR = path.join(process.cwd(), 'content/sections');
const FILE_NAME = /^(?<slug>[a-z0-9-]+?)(?:\.(?<locale>[a-z]{2}))?\.mdx$/;
const EM_DASH = String.fromCodePoint(0x20_14);

const topicFiles = readdirSync(TOPICS_DIR);
const sectionFiles = readdirSync(SECTIONS_DIR);

describe('completed Vietnamese real-time section', () => {
  it('has a translated overview and every registered lesson', () => {
    expect(sectionFiles).toContain('real-time-updates.vi.mdx');
    for (const topic of getSection('real-time-updates')?.topics ?? []) {
      expect(topicFiles).toContain(`${topic}.vi.mdx`);
    }
  });
});

describe.each(SECTIONS.map(({ slug }) => slug))('completed English section: %s', (slug) => {
  it('has a cheatsheet for every registered topic', () => {
    const section = getSection(slug);
    expect(section).toBeDefined();
    for (const topic of section?.topics ?? []) {
      expect(topicFiles, `missing content/topics/${topic}.mdx`).toContain(`${topic}.mdx`);
    }
  });

  it('has a section overview', () => {
    expect(sectionFiles).toContain(`${slug}.mdx`);
  });
});

function parseFrontmatter(source: string): unknown {
  const match = /^---\n(?<yaml>[\s\S]*?)\n---\n/.exec(source);
  return match?.groups?.yaml ? parse(match.groups.yaml) : undefined;
}

/** Lines of the markdown section under `## <heading>`, up to the next heading or JSX block. */
function sectionLines(source: string, heading: string): string[] {
  const start = source.indexOf(`## ${heading}\n`);
  if (start === -1) {
    return [];
  }
  const lines = source.slice(start).split('\n').slice(1);
  const end = lines.findIndex((line) => line.startsWith('#') || line.startsWith('<'));
  return lines.slice(0, end === -1 ? undefined : end).filter((line) => line.trim() !== '');
}

function checkLocaleSuffix(locale: string | undefined) {
  if (locale) {
    expect(locale).not.toBe(routing.defaultLocale);
    expect(routing.locales).toContain(locale);
  }
}

describe.each(topicFiles)('content/topics/%s', (file) => {
  const match = FILE_NAME.exec(file);
  const source = readFileSync(path.join(TOPICS_DIR, file), 'utf8');
  const frontmatter = topicFrontmatterSchema.safeParse(parseFrontmatter(source));
  const isVietnamese = match?.groups?.locale === 'vi';

  it('is named <topic>.mdx or <topic>.<locale>.mdx for a known topic and locale', () => {
    expect(match, 'file name').not.toBeNull();
    expect(isTopicSlug(match?.groups?.slug ?? ''), 'topic slug in the registry').toBe(true);
    checkLocaleSuffix(match?.groups?.locale);
  });

  it('has a translation only when the English file exists', () => {
    if (match?.groups?.locale) {
      expect(topicFiles).toContain(`${match.groups.slug}.mdx`);
    }
  });

  it('has valid frontmatter that does not list itself as related', () => {
    expect(frontmatter.error?.issues ?? []).toEqual([]);
    expect(frontmatter.data?.related).not.toContain(match?.groups?.slug);
  });

  it('fits the one-screen cheatsheet: short TL;DR, a few key points and interview questions', () => {
    // Markdown in this repo puts one sentence per line, so lines count sentences.
    const tldr = sectionLines(source, isVietnamese ? 'Tóm tắt' : 'TL;DR');
    expect(tldr.length, 'TL;DR sentences').toBeGreaterThanOrEqual(1);
    expect(tldr.length, 'TL;DR sentences').toBeLessThanOrEqual(3);

    const keyPoints = sectionLines(source, isVietnamese ? 'Ý chính' : 'Key points').filter((line) =>
      line.startsWith('- '),
    );
    expect(keyPoints.length, 'key points').toBeGreaterThanOrEqual(3);
    expect(keyPoints.length, 'key points').toBeLessThanOrEqual(5);

    const questions = source.match(/<InterviewQuestion /g) ?? [];
    expect(questions.length, 'interview questions').toBeGreaterThanOrEqual(2);
    expect(questions.length, 'interview questions').toBeLessThanOrEqual(4);
  });

  it('keeps everything else in a deep dive with references', () => {
    expect(source).toMatch(
      isVietnamese
        ? /<DeepDive>[\s\S]*### Tài liệu tham khảo[\s\S]*<\/DeepDive>/
        : /<DeepDive>[\s\S]*### References[\s\S]*<\/DeepDive>/,
    );
  });

  it('has a visual panel whose tabs match its content, starting with the declared visual', () => {
    const tabs = /<VisualPanel tabs=\{\[(?<list>[^\]]*)\]\}>/.exec(source)?.groups?.list;
    expect(tabs, 'VisualPanel tabs').toBeDefined();

    const declared = [...(tabs ?? '').matchAll(/'(?<kind>[a-z]+)'/g)].map((tab) => tab.groups?.kind);
    const rendered = [...source.matchAll(/<VisualTab kind="(?<kind>[a-z]+)">/g)].map((tab) => tab.groups?.kind);

    expect(rendered).toEqual(declared);
    expect(declared[0]).toBe(frontmatter.data?.visual);
  });

  it('never uses an em dash', () => {
    expect(source).not.toContain(EM_DASH);
  });
});

describe.each(sectionFiles)('content/sections/%s', (file) => {
  const match = FILE_NAME.exec(file);
  const source = readFileSync(path.join(SECTIONS_DIR, file), 'utf8');

  it('is named <section>.mdx or <section>.<locale>.mdx for a known section and locale', () => {
    expect(match, 'file name').not.toBeNull();
    expect(isSectionSlug(match?.groups?.slug ?? ''), 'section slug in the registry').toBe(true);
    checkLocaleSuffix(match?.groups?.locale);
  });

  it('never uses an em dash', () => {
    expect(source).not.toContain(EM_DASH);
  });
});

describe.each(topicFiles.filter((file) => file.endsWith('.vi.mdx')))('translation completeness: %s', (file) => {
  it('preserves navigation, examples, references and the number of questions', () => {
    const source = readFileSync(path.join(TOPICS_DIR, file), 'utf8');
    const original = readFileSync(path.join(TOPICS_DIR, file.replace('.vi.mdx', '.mdx')), 'utf8');
    const translatedMetadata = topicFrontmatterSchema.parse(parseFrontmatter(source));
    const originalMetadata = topicFrontmatterSchema.parse(parseFrontmatter(original));
    expect(translatedMetadata.visual).toBe(originalMetadata.visual);
    expect(translatedMetadata.related).toEqual(originalMetadata.related);
    expect(source.match(/<InterviewQuestion /g)?.length).toBe(original.match(/<InterviewQuestion /g)?.length);
    expect(source.match(/^```[a-z0-9-]+/gm)).toEqual(original.match(/^```[a-z0-9-]+/gm));
    const referenceUrls = (text: string) => [...text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1]);
    expect(referenceUrls(source)).toEqual(referenceUrls(original));
    for (const heading of [
      '## Tóm tắt',
      '## Ý chính',
      '## Cân nhắc',
      '## Câu hỏi phỏng vấn',
      '### Cơ chế hoạt động',
      '### Trường hợp biên',
      '### Lỗi thường gặp',
      '### Tài liệu tham khảo',
    ]) {
      expect(source).toContain(`${heading}\n`);
    }
  });
});
