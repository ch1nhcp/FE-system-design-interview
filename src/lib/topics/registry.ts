/**
 * Structure of the study site: the 14 sections of the front end system design cheatsheet and the topics in each,
 * in reading order. Slugs are part of public URLs, so treat them as stable.
 * A topic can belong to more than one section; it still has a single page and a single progress status.
 */
export const SECTIONS = [
  {
    slug: 'architecture',
    topics: [
      'server-side-rendering',
      'client-side-rendering',
      'incremental-static-regeneration',
      'serverless',
      'edge-computing',
      'server-components',
    ],
  },
  {
    slug: 'state-management',
    topics: ['event-sourcing', 'flux-architecture', 'normalized-state'],
  },
  {
    slug: 'backend-apis',
    topics: ['rest', 'graphql', 'pagination', 'authentication', 'authorization'],
  },
  {
    slug: 'real-time-updates',
    topics: ['short-polling', 'long-polling', 'server-sent-events', 'websockets'],
  },
  {
    slug: 'component-apis',
    topics: ['theming', 'event-handlers', 'render-props', 'composition'],
  },
  {
    slug: 'networking',
    topics: [
      'batching',
      'retries',
      'debouncing-updates',
      'optimistic-updates',
      'timeouts',
      'race-conditions',
      'offline-usage',
      'caching-and-expiry',
    ],
  },
  {
    slug: 'performance',
    topics: [
      'code-splitting',
      'tree-shaking',
      'preloading-and-prefetching',
      'list-virtualization',
      'compression',
      'loading-sequence',
      'above-the-fold',
      'debouncing-and-throttling',
      'optimistic-updates',
      'memoization',
      'memory-leaks',
      'dom-batching',
      'reflows-and-repaints',
      'adaptive-loading',
      'core-web-vitals',
    ],
  },
  {
    slug: 'images',
    topics: [
      'image-cdn',
      'image-formats',
      'image-lazy-loading',
      'alt-text',
      'responsive-images',
      'preload-link',
      'adaptive-images',
    ],
  },
  {
    slug: 'accessibility',
    topics: ['keyboard-interactions', 'wai-aria', 'heading-hierarchy', 'focus-management', 'visual-accessibility'],
  },
  {
    slug: 'seo',
    topics: ['title-and-meta', 'sitemap', 'structured-data', 'semantic-markup', 'heading-hierarchy', 'prerendering'],
  },
  {
    slug: 'user-experience',
    topics: ['ui-states', 'error-handling', 'infinite-scrolling', 'long-strings', 'mobile-friendliness'],
  },
  {
    slug: 'security',
    topics: ['https', 'xss', 'csrf', 'cors', 'csp'],
  },
  {
    slug: 'i18n',
    topics: [
      'lang-and-hreflang',
      'right-to-left',
      'template-strings',
      'locale-formatting',
      'text-in-images',
      'input-method-editors',
    ],
  },
  {
    slug: 'common-patterns',
    topics: [
      'infinite-scrolling',
      'event-sourcing',
      'reducer-pattern',
      'undo-redo',
      'media-streaming',
      'conflict-resolution',
    ],
  },
] as const;

export type Section = (typeof SECTIONS)[number];
export type SectionSlug = Section['slug'];
export type TopicSlug = Section['topics'][number];

/** Every topic once, in reading order (a shared topic sits at its first occurrence). */
export const TOPIC_SLUGS: readonly TopicSlug[] = [...new Set<TopicSlug>(SECTIONS.flatMap((section) => section.topics))];

const SECTION_SLUGS: ReadonlySet<string> = new Set(SECTIONS.map((section) => section.slug));
const TOPIC_SLUG_SET: ReadonlySet<string> = new Set(TOPIC_SLUGS);

export function isSectionSlug(value: string): value is SectionSlug {
  return SECTION_SLUGS.has(value);
}

export function isTopicSlug(value: string): value is TopicSlug {
  return TOPIC_SLUG_SET.has(value);
}

export function getSection(slug: string): Section | undefined {
  return SECTIONS.find((section) => section.slug === slug);
}

export function getTopicSections(topic: TopicSlug): Section[] {
  return SECTIONS.filter((section) => (section.topics as readonly TopicSlug[]).includes(topic));
}

export function getAdjacentTopics(topic: TopicSlug): { previous: TopicSlug | null; next: TopicSlug | null } {
  const index = TOPIC_SLUGS.indexOf(topic);
  return {
    previous: TOPIC_SLUGS[index - 1] ?? null,
    next: TOPIC_SLUGS[index + 1] ?? null,
  };
}
