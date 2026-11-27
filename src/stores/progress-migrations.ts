import { z } from 'zod';

import type { TopicSlug } from '@/lib/topics/registry';

/** Version 1 stored checklist items as `<sectionId>.<itemId>` with camelCase ids. */
const LEGACY_ITEM_TO_TOPIC: Readonly<Record<string, TopicSlug>> = {
  ssr: 'server-side-rendering',
  csr: 'client-side-rendering',
  isr: 'incremental-static-regeneration',
  serverless: 'serverless',
  edgeComputing: 'edge-computing',
  serverComponents: 'server-components',
  eventSourcing: 'event-sourcing',
  fluxArchitecture: 'flux-architecture',
  normalizedState: 'normalized-state',
  rest: 'rest',
  graphql: 'graphql',
  pagination: 'pagination',
  authentication: 'authentication',
  authorization: 'authorization',
  shortPolling: 'short-polling',
  longPolling: 'long-polling',
  serverSentEvents: 'server-sent-events',
  webSockets: 'websockets',
  themingConfig: 'theming',
  eventHandlers: 'event-handlers',
  renderProps: 'render-props',
  composition: 'composition',
  batching: 'batching',
  retries: 'retries',
  debouncingUpdates: 'debouncing-updates',
  optimisticUpdates: 'optimistic-updates',
  timeout: 'timeouts',
  raceConditions: 'race-conditions',
  offlineUsage: 'offline-usage',
  cachingExpiry: 'caching-and-expiry',
  codeSplitting: 'code-splitting',
  treeShaking: 'tree-shaking',
  preloadPrefetch: 'preloading-and-prefetching',
  listVirtualization: 'list-virtualization',
  compression: 'compression',
  loadingSequence: 'loading-sequence',
  aboveTheFold: 'above-the-fold',
  debounceThrottle: 'debouncing-and-throttling',
  memoization: 'memoization',
  memoryLeaks: 'memory-leaks',
  domBatching: 'dom-batching',
  reflows: 'reflows-and-repaints',
  adaptiveLoading: 'adaptive-loading',
  coreWebVitals: 'core-web-vitals',
  cdn: 'image-cdn',
  imageFormats: 'image-formats',
  lazyImages: 'image-lazy-loading',
  altText: 'alt-text',
  responsiveImages: 'responsive-images',
  preloadLink: 'preload-link',
  adaptiveImages: 'adaptive-images',
  keyboard: 'keyboard-interactions',
  aria: 'wai-aria',
  headingHierarchy: 'heading-hierarchy',
  focusManagement: 'focus-management',
  visual: 'visual-accessibility',
  titleMeta: 'title-and-meta',
  sitemap: 'sitemap',
  structuredData: 'structured-data',
  semanticMarkup: 'semantic-markup',
  prerendering: 'prerendering',
  uiStates: 'ui-states',
  errorHandling: 'error-handling',
  infiniteScrolling: 'infinite-scrolling',
  longStrings: 'long-strings',
  mobileFriendliness: 'mobile-friendliness',
  https: 'https',
  xss: 'xss',
  csrf: 'csrf',
  cors: 'cors',
  csp: 'csp',
  langAttributes: 'lang-and-hreflang',
  rtl: 'right-to-left',
  templateStrings: 'template-strings',
  localeFormatting: 'locale-formatting',
  noTextInImages: 'text-in-images',
  ime: 'input-method-editors',
  reducerPattern: 'reducer-pattern',
  undoRedo: 'undo-redo',
  mediaStreaming: 'media-streaming',
  conflictResolution: 'conflict-resolution',
};

const v1StateSchema = z.object({
  checked: z.record(z.string(), z.boolean()),
});

/** Converts v1 checklist progress to v2 topic statuses. Anything unrecognized is dropped. */
export function migrateV1ToV2(persisted: unknown): { topics: Partial<Record<TopicSlug, 'learned'>> } {
  const result = v1StateSchema.safeParse(persisted);
  if (!result.success) {
    return { topics: {} };
  }

  const learned = Object.entries(result.data.checked)
    .filter(([, isChecked]) => isChecked)
    .map(([key]) => LEGACY_ITEM_TO_TOPIC[key.split('.')[1] ?? ''])
    .filter((topic): topic is TopicSlug => topic !== undefined);

  return { topics: Object.fromEntries(learned.map((topic) => [topic, 'learned' as const])) };
}
