import { expect, test } from './fixtures';

const TOPICS = [
  { slug: 'title-and-meta', section: 'seo', visual: 'Code' },
  { slug: 'sitemap', section: 'seo', visual: 'Code' },
  { slug: 'structured-data', section: 'seo', visual: 'Code' },
  { slug: 'semantic-markup', section: 'seo', visual: 'Code' },
  { slug: 'prerendering', section: 'seo', visual: 'Diagram' },
  { slug: 'ui-states', section: 'user-experience', visual: 'Diagram' },
  { slug: 'error-handling', section: 'user-experience', visual: 'Diagram' },
  { slug: 'infinite-scrolling', section: 'user-experience', visual: 'Diagram' },
  { slug: 'long-strings', section: 'user-experience', visual: 'Code' },
  { slug: 'mobile-friendliness', section: 'user-experience', visual: 'Code' },
] as const;

test.describe('SEO and user experience batch', () => {
  for (const topic of TOPICS) {
    test(`reads ${topic.slug} and its English fallback`, async ({ page, isMobile }) => {
      if (!isMobile) await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/sections/${topic.section}`);
      const overview = topic.section === 'seo' ? 'Make public content discoverable' : 'Keep the task recoverable';
      await expect(page.getByRole('main').getByRole('heading', { name: overview, exact: true })).toBeVisible();
      const link = page.getByRole('main').locator(`a[href="/topics/${topic.slug}"]`);
      await expect(link).toHaveAccessibleName(/\S/);
      await link.click();
      await expect(page).toHaveURL(`/topics/${topic.slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
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
      await panel.getByRole('tab', { name: 'Diagram', exact: true }).click();
      await expect(panel.getByRole('figure')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      await page.getByText('Deep dive', { exact: true }).click();
      await expect(page.getByRole('heading', { name: 'References', exact: true })).toBeVisible();
      await page.goto(`/vi/topics/${topic.slug}`);
      await expect(page.getByRole('note')).toBeVisible();
      await expect(page.locator('[lang="en"]').getByRole('heading', { name: 'TL;DR', exact: true })).toBeVisible();
    });
  }

  test('shares infinite scrolling and its progress with Common patterns', async ({ page }) => {
    await page.goto('/sections/user-experience');
    await page.getByRole('main').getByRole('link', { name: 'Infinite scrolling', exact: true }).click();
    await expect(page).toHaveURL('/topics/infinite-scrolling');
    await page.getByRole('checkbox', { name: 'Learned', exact: true }).check();
    await page.goto('/sections/common-patterns');
    await page.getByRole('main').getByRole('link', { name: 'Infinite scrolling', exact: true }).click();
    await expect(page).toHaveURL('/topics/infinite-scrolling');
    await expect(page.getByRole('checkbox', { name: 'Learned', exact: true })).toBeChecked();
    const header = page.getByRole('article').locator(':scope > header');
    await expect(header.getByRole('link', { name: 'User experience', exact: true })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Common patterns', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'TL;DR', exact: true })).toBeVisible();
  });

  test('keeps long content readable at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/topics/long-strings');
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    await page.getByRole('tab', { name: 'Diagram', exact: true }).click();
    await expect(page.getByRole('figure')).toBeVisible();
    await page.getByText('Deep dive', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'References', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});
