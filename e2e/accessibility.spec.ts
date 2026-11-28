import AxeBuilder from '@axe-core/playwright';

import { expect, test } from './fixtures';

const paths = [
  '/',
  '/vi',
  '/framework',
  '/vi/flashcards',
  '/sections/performance',
  '/topics/websockets',
  '/topics/server-side-rendering',
  '/topics/retries',
  '/topics/race-conditions',
  '/topics/debouncing-and-throttling',
  '/topics/loading-sequence',
  '/topics/list-virtualization',
  '/topics/csrf',
];

for (const theme of ['light', 'dark']) {
  test(`has no automated accessibility violations in ${theme} mode`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
    for (const path of paths) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveClass(new RegExp(theme));
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      expect(result.violations, `${path} (${theme})`).toEqual([]);
    }
  });
}

test('keeps expanded study content and search accessible', async ({ page }) => {
  await page.goto('/flashcards');
  await page.getByRole('button', { name: 'Show answer', exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: /Search topics/ }).click();
  await page.getByRole('combobox', { name: 'Search topics', exact: true }).fill('WebSockets');
  await expect(page.getByRole('option').first()).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('keeps navigation and lesson controls visible when text is enlarged to 200%', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const [prefix, label, search] of [
    ['', 'EN', 'Search topics'],
    ['/vi', 'VI', 'Tìm chủ đề'],
  ] as const) {
    await page.goto(`${prefix}/topics/websockets`);
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    await expect(page.getByRole('button', { name: label, exact: true })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: new RegExp(search) })).toBeInViewport({ ratio: 1 });
    const tabs = await page.getByRole('tablist').boundingBox();
    expect(tabs).not.toBeNull();
    expect(tabs!.x + tabs!.width).toBeLessThanOrEqual(1280);
  }
});

test('always offers section navigation around responsive boundaries', async ({ page }) => {
  await page.goto('/topics/websockets');
  for (const scale of [1, 2]) {
    await page.addStyleTag({ content: `html { font-size: ${scale * 100}%; }` });
    for (const width of [1023, 1024, 1055, 1056]) {
      await page.setViewportSize({ width: width * scale, height: 900 });
      const drawer = page.getByRole('button', { name: 'Open navigation', exact: true });
      await expect.poll(async () => (await drawer.isVisible()) || (await page.locator('aside').isVisible())).toBe(true);
    }
  }
});
