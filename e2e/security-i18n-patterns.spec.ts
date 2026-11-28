import { expect, test } from './fixtures';

const TOPICS = [
  { slug: 'https', section: 'security', visual: 'Code' },
  { slug: 'xss', section: 'security', visual: 'Code' },
  { slug: 'csrf', section: 'security', visual: 'Code' },
  { slug: 'cors', section: 'security', visual: 'Code' },
  { slug: 'csp', section: 'security', visual: 'Code' },
  { slug: 'lang-and-hreflang', section: 'i18n', visual: 'Code' },
  { slug: 'right-to-left', section: 'i18n', visual: 'Code' },
  { slug: 'template-strings', section: 'i18n', visual: 'Code' },
  { slug: 'locale-formatting', section: 'i18n', visual: 'Code' },
  { slug: 'text-in-images', section: 'i18n', visual: 'Code' },
  { slug: 'input-method-editors', section: 'i18n', visual: 'Code' },
  { slug: 'reducer-pattern', section: 'common-patterns', visual: 'Code' },
  { slug: 'undo-redo', section: 'common-patterns', visual: 'Code' },
  { slug: 'media-streaming', section: 'common-patterns', visual: 'Diagram' },
  { slug: 'conflict-resolution', section: 'common-patterns', visual: 'Diagram' },
] as const;

test.describe('Security, i18n and common patterns batch', () => {
  for (const topic of TOPICS) {
    test(`reads ${topic.slug} and its English fallback`, async ({ page, isMobile }) => {
      if (!isMobile) await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/sections/${topic.section}`);
      const overview = {
        security: 'Protect the right boundary',
        i18n: 'Preserve meaning across languages',
        'common-patterns': 'Choose the state and interaction contract',
      }[topic.section];
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
});
