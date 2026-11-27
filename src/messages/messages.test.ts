import { describe, expect, it } from 'vitest';

import en from './en.json';
import vi from './vi.json';

function flattenKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]: [string, unknown]) =>
    typeof child === 'object' && child !== null ? flattenKeys(child, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe('messages', () => {
  it('defines the same keys in English and Vietnamese', () => {
    expect([...flattenKeys(vi)].sort()).toEqual([...flattenKeys(en)].sort());
  });

  it('never uses an em dash in user-facing copy', () => {
    const emDash = String.fromCodePoint(0x20_14);

    for (const [locale, messages] of Object.entries({ en, vi })) {
      expect(JSON.stringify(messages), locale).not.toContain(emDash);
    }
  });
});
