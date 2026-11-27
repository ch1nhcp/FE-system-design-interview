import type { Locator } from '@playwright/test';

import { expect, test } from './fixtures';

const TOPICS = [
  {
    slug: 'code-splitting',
    label: 'Bundle splitting, lazy loading and code splitting (route-based, interaction, visibility-based)',
    visual: 'Code',
  },
  { slug: 'tree-shaking', label: 'Tree shaking', visual: 'Code' },
  { slug: 'preloading-and-prefetching', label: 'Preloading and prefetching (JS, data)', visual: 'Code' },
  { slug: 'list-virtualization', label: 'List virtualization', visual: 'Animation' },
  { slug: 'compression', label: 'Compression (code, media)', visual: 'Code' },
  { slug: 'loading-sequence', label: 'Optimize loading sequences', visual: 'Animation' },
  { slug: 'above-the-fold', label: 'Prioritize above-the-fold content', visual: 'Code' },
  { slug: 'debouncing-and-throttling', label: 'Debouncing and throttling', visual: 'Animation' },
  { slug: 'memoization', label: 'Caching and memoizing', visual: 'Code' },
  { slug: 'memory-leaks', label: 'Memory leaks', visual: 'Code' },
  { slug: 'dom-batching', label: 'DOM changes: batching and minimizing', visual: 'Code' },
  { slug: 'reflows-and-repaints', label: 'Reducing reflows and repaints', visual: 'Diagram' },
  { slug: 'adaptive-loading', label: 'Adaptive loading', visual: 'Code' },
  { slug: 'core-web-vitals', label: 'Core Web Vitals', visual: 'Code' },
] as const;

async function finishTimeline(panel: Locator) {
  const next = panel.getByRole('button', { name: 'Next step', exact: true });
  for (let step = 0; step < 40 && !(await next.isDisabled()); step++) await next.click();
  await expect(next).toBeDisabled();
}

function stat(panel: Locator, label: string) {
  return panel
    .locator('dt')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .locator('..')
    .locator('dd');
}

test.describe('performance batch', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const topic of TOPICS) {
    test(`reads ${topic.slug} and its English fallback`, async ({ page, isMobile }) => {
      if (!isMobile) await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/sections/performance');
      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { name: 'Diagnose before choosing', exact: true })).toBeVisible();
      await main.getByRole('link', { name: topic.label, exact: true }).click();
      await expect(page).toHaveURL(`/topics/${topic.slug}`);
      await expect(page.getByRole('heading', { level: 1, name: topic.label, exact: true })).toBeVisible();
      const panel = page.getByRole('region', { name: 'Visual', exact: true });
      await expect(panel.getByRole('tab', { name: topic.visual, exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      if (!isMobile) {
        const body = page.locator('.topic-body');
        const start = await body.getByRole('heading', { name: 'TL;DR', exact: true }).boundingBox();
        const end = await body.locator(':scope > details').last().boundingBox();
        expect(start).not.toBeNull();
        expect(end).not.toBeNull();
        expect(end!.y - start!.y, `${topic.slug} summary height`).toBeLessThanOrEqual(820);
      }
      await panel.getByRole('tab', { name: 'Code', exact: true }).click();
      await expect(panel.locator('pre').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      await page.getByText('Deep dive', { exact: true }).click();
      await expect(page.getByRole('heading', { name: 'References', exact: true })).toBeVisible();
      await page.goto(`/vi/topics/${topic.slug}`);
      await expect(page.getByRole('note')).toBeVisible();
      await expect(page.locator('[lang="en"]').getByRole('heading', { name: 'TL;DR', exact: true })).toBeVisible();
    });
  }

  test('compares debounce and throttle and respects reduced motion', async ({ page }) => {
    await page.goto('/topics/debouncing-and-throttling');
    const panel = page.getByRole('region', { name: 'Visual', exact: true });
    await panel.locator('figure').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await expect(panel.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    await finishTimeline(panel);
    await expect(stat(panel, 'Dispatches')).toHaveText('2');
    await expect(stat(panel, 'Last value')).toHaveText('7');
    await panel.getByRole('button', { name: 'Throttle', exact: true }).click();
    await expect(stat(panel, 'Dispatches')).toHaveText('0');
    await finishTimeline(panel);
    await expect(stat(panel, 'Dispatches')).toHaveText('3');
    await panel.getByRole('button', { name: 'Restart', exact: true }).click();
    await expect(panel.getByRole('button', { name: 'Previous step', exact: true })).toBeDisabled();
  });

  test('compares loading discovery and supports pause and restart', async ({ page }) => {
    await page.goto('/topics/loading-sequence');
    const panel = page.getByRole('region', { name: 'Visual', exact: true });
    await finishTimeline(panel);
    await expect(stat(panel, 'Content visible')).toHaveText('900 ms');
    await panel.getByRole('button', { name: 'Sequential', exact: true }).click();
    await finishTimeline(panel);
    await expect(stat(panel, 'Content visible')).toHaveText('2100 ms');
    await panel.getByRole('button', { name: 'Restart', exact: true }).click();
    await panel.getByRole('button', { name: 'Play', exact: true }).click();
    await panel.getByRole('button', { name: 'Pause', exact: true }).click();
    await panel.getByRole('button', { name: 'Restart', exact: true }).click();
    await expect(stat(panel, 'Resources ready')).toHaveText('0/4');
    await page.goto('/vi/topics/loading-sequence');
    await expect(page.getByRole('button', { name: 'Song song', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('models a bounded list window and supports stepping backward', async ({ page }) => {
    await page.goto('/topics/list-virtualization');
    const panel = page.getByRole('region', { name: 'Visual', exact: true });
    await expect(stat(panel, 'Mounted rows')).toHaveText('7');
    await finishTimeline(panel);
    await expect(panel.getByText('Visible rows 996 to 1000', { exact: true })).toBeVisible();
    await panel.getByRole('button', { name: 'Previous step', exact: true }).click();
    await expect(stat(panel, 'Mounted rows')).toHaveText('9');
    await panel.getByRole('button', { name: 'All rows', exact: true }).click();
    await expect(stat(panel, 'Mounted rows')).toHaveText('1000');
    await expect(panel.getByText('Visible rows 1 to 5', { exact: true })).toBeVisible();
  });

  test('reuses the networking optimistic-updates page', async ({ page }) => {
    await page.goto('/sections/performance');
    await page.getByRole('main').getByRole('link', { name: 'Optimistic updates', exact: true }).click();
    await expect(page).toHaveURL('/topics/optimistic-updates');
    const header = page.getByRole('article').locator(':scope > header');
    await expect(header.getByRole('link', { name: 'Networking techniques', exact: true })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Performance', exact: true })).toBeVisible();
  });
});
