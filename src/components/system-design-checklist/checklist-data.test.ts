import { describe, expect, it } from 'vitest';

import messages from '@/messages/en.json';

import {
  CHECKLIST_SECTIONS,
  CHECKLIST_TOTAL_ITEMS,
  countCheckedInSection,
  countCheckedItems,
  getChecklistItemKey,
} from './checklist-data';

describe('checklist data', () => {
  it('has the 14 sections from the cheatsheet with 85 items in total', () => {
    expect(CHECKLIST_SECTIONS).toHaveLength(14);
    expect(CHECKLIST_TOTAL_ITEMS).toBe(85);
  });

  it('has unique section ids and no duplicate items within a section', () => {
    const sectionIds = CHECKLIST_SECTIONS.map((section) => section.id);
    expect(new Set(sectionIds).size).toBe(sectionIds.length);

    for (const section of CHECKLIST_SECTIONS) {
      expect(new Set(section.items).size, section.id).toBe(section.items.length);
    }
  });

  it('uses every item label defined in the messages', () => {
    const usedItems = new Set(CHECKLIST_SECTIONS.flatMap((section) => section.items));

    expect([...usedItems].sort()).toEqual(Object.keys(messages.Checklist.items).sort());
  });

  it('builds item keys scoped to their section', () => {
    expect(getChecklistItemKey('networking', 'optimisticUpdates')).toBe('networking.optimisticUpdates');
    expect(getChecklistItemKey('performance', 'optimisticUpdates')).toBe('performance.optimisticUpdates');
  });

  it('counts only checked items that belong to the section', () => {
    const architecture = CHECKLIST_SECTIONS[0];
    if (!architecture) {
      throw new Error('Expected the architecture section');
    }

    const checked = {
      'architecture.ssr': true,
      'architecture.csr': false,
      'architecture.unknownItem': true,
      'security.xss': true,
    };

    expect(countCheckedInSection(architecture, checked)).toBe(1);
    expect(countCheckedItems(checked)).toBe(2);
  });
});
