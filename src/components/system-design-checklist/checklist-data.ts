import type messages from '@/messages/en.json';

type ChecklistMessages = (typeof messages)['Checklist'];

export type ChecklistSectionId = keyof ChecklistMessages['sections'];
export type ChecklistItemId = keyof ChecklistMessages['items'];

export type ChecklistSection = {
  readonly id: ChecklistSectionId;
  readonly items: readonly ChecklistItemId[];
};

/**
 * Sections and items of the front end system design checklist, in study order.
 * Labels live in the `Checklist` messages namespace; an item may appear in several sections.
 */
export const CHECKLIST_SECTIONS: readonly ChecklistSection[] = [
  {
    id: 'architecture',
    items: ['ssr', 'csr', 'isr', 'serverless', 'edgeComputing', 'serverComponents'],
  },
  {
    id: 'stateManagement',
    items: ['eventSourcing', 'fluxArchitecture', 'normalizedState'],
  },
  {
    id: 'backendApis',
    items: ['rest', 'graphql', 'pagination', 'authentication', 'authorization'],
  },
  {
    id: 'realTimeUpdates',
    items: ['shortPolling', 'longPolling', 'serverSentEvents', 'webSockets'],
  },
  {
    id: 'componentApis',
    items: ['themingConfig', 'eventHandlers', 'renderProps', 'composition'],
  },
  {
    id: 'networking',
    items: [
      'batching',
      'retries',
      'debouncingUpdates',
      'optimisticUpdates',
      'timeout',
      'raceConditions',
      'offlineUsage',
      'cachingExpiry',
    ],
  },
  {
    id: 'performance',
    items: [
      'codeSplitting',
      'treeShaking',
      'preloadPrefetch',
      'listVirtualization',
      'compression',
      'loadingSequence',
      'aboveTheFold',
      'debounceThrottle',
      'optimisticUpdates',
      'memoization',
      'memoryLeaks',
      'domBatching',
      'reflows',
      'adaptiveLoading',
      'coreWebVitals',
    ],
  },
  {
    id: 'images',
    items: ['cdn', 'imageFormats', 'lazyImages', 'altText', 'responsiveImages', 'preloadLink', 'adaptiveImages'],
  },
  {
    id: 'accessibility',
    items: ['keyboard', 'aria', 'headingHierarchy', 'focusManagement', 'visual'],
  },
  {
    id: 'seo',
    items: ['titleMeta', 'sitemap', 'structuredData', 'semanticMarkup', 'headingHierarchy', 'prerendering'],
  },
  {
    id: 'userExperience',
    items: ['uiStates', 'errorHandling', 'infiniteScrolling', 'longStrings', 'mobileFriendliness'],
  },
  {
    id: 'security',
    items: ['https', 'xss', 'csrf', 'cors', 'csp'],
  },
  {
    id: 'i18n',
    items: ['langAttributes', 'rtl', 'templateStrings', 'localeFormatting', 'noTextInImages', 'ime'],
  },
  {
    id: 'commonPatterns',
    items: ['infiniteScrolling', 'eventSourcing', 'reducerPattern', 'undoRedo', 'mediaStreaming', 'conflictResolution'],
  },
];

export const CHECKLIST_TOTAL_ITEMS = CHECKLIST_SECTIONS.reduce((total, section) => total + section.items.length, 0);

/** Progress is tracked per section, so an item repeated in two sections is checked independently. */
export function getChecklistItemKey(sectionId: ChecklistSectionId, itemId: ChecklistItemId): string {
  return `${sectionId}.${itemId}`;
}

export function countCheckedInSection(section: ChecklistSection, checked: Readonly<Record<string, boolean>>): number {
  return section.items.filter((itemId) => checked[getChecklistItemKey(section.id, itemId)] === true).length;
}

export function countCheckedItems(checked: Readonly<Record<string, boolean>>): number {
  return CHECKLIST_SECTIONS.reduce((total, section) => total + countCheckedInSection(section, checked), 0);
}
