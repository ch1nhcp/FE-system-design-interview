import { describe, expect, it } from 'vitest';

import messages from '@/messages/en.json';

import {
  SECTIONS,
  TOPIC_SLUGS,
  getAdjacentTopics,
  getSection,
  getTopicSections,
  isSectionSlug,
  isTopicSlug,
} from './registry';

describe('topic registry', () => {
  it('has the 14 sections of the cheatsheet with 85 entries and 81 unique topics', () => {
    expect(SECTIONS).toHaveLength(14);
    expect(SECTIONS.reduce((total, section) => total + section.topics.length, 0)).toBe(85);
    expect(TOPIC_SLUGS).toHaveLength(81);
    expect(new Set(TOPIC_SLUGS).size).toBe(81);
  });

  it('uses kebab-case slugs that are safe in URLs', () => {
    const slugs = [...SECTIONS.map((section) => section.slug), ...TOPIC_SLUGS];

    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('has a title and description for every section and a label for every topic', () => {
    expect(Object.keys(messages.Sections).sort()).toEqual(SECTIONS.map((section) => section.slug).sort());
    expect(Object.keys(messages.Topics).sort()).toEqual([...TOPIC_SLUGS].sort());
  });

  it('lists topics shared by two sections in both', () => {
    expect(getTopicSections('optimistic-updates').map((section) => section.slug)).toEqual([
      'networking',
      'performance',
    ]);
    expect(getTopicSections('heading-hierarchy').map((section) => section.slug)).toEqual(['accessibility', 'seo']);
  });

  it('finds sections by slug', () => {
    expect(getSection('security')?.topics).toEqual(['https', 'xss', 'csrf', 'cors', 'csp']);
    expect(getSection('unknown')).toBeUndefined();
  });

  it('narrows unknown strings to slugs', () => {
    expect(isSectionSlug('performance')).toBe(true);
    expect(isSectionSlug('nope')).toBe(false);
    expect(isTopicSlug('websockets')).toBe(true);
    expect(isTopicSlug('nope')).toBe(false);
  });

  it('links topics in reading order across sections', () => {
    expect(getAdjacentTopics('server-side-rendering')).toEqual({ previous: null, next: 'client-side-rendering' });
    expect(getAdjacentTopics('server-components')).toEqual({ previous: 'edge-computing', next: 'event-sourcing' });
    expect(getAdjacentTopics('conflict-resolution')).toEqual({ previous: 'media-streaming', next: null });
  });

  it('places a shared topic at its first occurrence in the reading order', () => {
    expect(TOPIC_SLUGS.indexOf('optimistic-updates')).toBeLessThan(TOPIC_SLUGS.indexOf('code-splitting'));
    expect(getAdjacentTopics('infinite-scrolling').previous).toBe('error-handling');
  });
});
