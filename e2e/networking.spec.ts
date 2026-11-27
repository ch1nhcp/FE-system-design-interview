import type { Locator } from '@playwright/test';

import { expect, test } from './fixtures';

const TOPICS = [
  { slug: 'batching', label: 'Batching', visual: 'Diagram' },
  { slug: 'retries', label: 'Retries with exponential backoff and jitter', visual: 'Animation' },
  { slug: 'debouncing-updates', label: 'Debouncing updates', visual: 'Code' },
  { slug: 'optimistic-updates', label: 'Optimistic updates', visual: 'Diagram' },
  { slug: 'timeouts', label: 'Timeout', visual: 'Code' },
  { slug: 'race-conditions', label: 'Out-of-order responses and race conditions', visual: 'Animation' },
  { slug: 'offline-usage', label: 'Offline usage', visual: 'Diagram' },
  { slug: 'caching-and-expiry', label: 'Caching and expiry', visual: 'Code' },
] as const;

async function finishTimeline(panel: Locator) {
  const next = panel.getByRole('button', { name: 'Next step', exact: true });
  for (let step = 0; step < 25 && !(await next.isDisabled()); step++) {
    await next.click();
  }
  await expect(next).toBeDisabled();
}

test.describe('networking batch', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const topic of TOPICS) {
    test(`reads ${topic.slug} and its locale fallback`, async ({ page, isMobile }) => {
      if (!isMobile) await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/sections/networking');
      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { name: 'Compose the safeguards', exact: true })).toBeVisible();
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

  test('steps retries, compares policies and restarts without autoplay in reduced motion', async ({ page }) => {
    await page.goto('/topics/retries');
    const panel = page.getByRole('region', { name: 'Visual', exact: true });
    await panel.locator('figure').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await expect(panel.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Jitter', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await finishTimeline(panel);
    await expect(panel.getByText('3/3', { exact: true })).toBeVisible();
    await expect(panel.getByText('All three clients have succeeded on their third attempt.')).toBeVisible();
    await panel.getByRole('button', { name: 'Backoff', exact: true }).click();
    await expect(panel.getByText('0/3', { exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Previous step', exact: true })).toBeDisabled();

    await panel.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(panel.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    await panel.getByRole('button', { name: 'Pause', exact: true }).click();
    await panel.getByRole('button', { name: 'Restart', exact: true }).click();
    await expect(panel.getByText('Three clients are about to make the same read.')).toBeVisible();
  });

  test('shows the stale response bug and compares the latest-only guard', async ({ page }) => {
    await page.goto('/topics/race-conditions');
    const panel = page.getByRole('region', { name: 'Visual', exact: true });
    await panel.getByRole('button', { name: 'Unguarded', exact: true }).click();
    await finishTimeline(panel);
    await expect(
      panel.getByText('The older r response overwrites the newer results. The input still says react.'),
    ).toBeVisible();
    await expect(panel.getByText('Displayed results: r', { exact: true })).toBeVisible();
    await panel.getByRole('button', { name: 'Latest only', exact: true }).click();
    await finishTimeline(panel);
    await expect(
      panel.getByText('The older r response arrives but is ignored. Results still match react.'),
    ).toBeVisible();
    await expect(panel.getByText('Displayed results: react', { exact: true })).toBeVisible();

    await page.goto('/vi/topics/race-conditions');
    await expect(page.getByRole('button', { name: 'Chỉ nhận mới nhất', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
