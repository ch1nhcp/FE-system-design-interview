import { expect, test } from './fixtures';

const TOPICS = [
  { slug: 'image-cdn', section: 'images', visual: 'Diagram' },
  { slug: 'image-formats', section: 'images', visual: 'Code' },
  { slug: 'image-lazy-loading', section: 'images', visual: 'Code' },
  { slug: 'alt-text', section: 'images', visual: 'Code' },
  { slug: 'responsive-images', section: 'images', visual: 'Code' },
  { slug: 'preload-link', section: 'images', visual: 'Code' },
  { slug: 'adaptive-images', section: 'images', visual: 'Code' },
  { slug: 'keyboard-interactions', section: 'accessibility', visual: 'Code' },
  { slug: 'wai-aria', section: 'accessibility', visual: 'Code' },
  { slug: 'heading-hierarchy', section: 'accessibility', visual: 'Code' },
  { slug: 'focus-management', section: 'accessibility', visual: 'Code' },
  { slug: 'visual-accessibility', section: 'accessibility', visual: 'Code' },
] as const;

test.describe('images and accessibility batch', () => {
  for (const topic of TOPICS) {
    test(`reads ${topic.slug} and its English fallback`, async ({ page, isMobile }) => {
      if (!isMobile) await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/sections/${topic.section}`);
      const main = page.getByRole('main');
      const overviewTitle = topic.section === 'images' ? 'Choose the image pipeline' : 'Build an operable task';
      await expect(main.getByRole('heading', { name: overviewTitle, exact: true })).toBeVisible();
      const link = main.locator(`a[href="/topics/${topic.slug}"]`);
      await expect(link).toHaveAccessibleName(/\S/);
      await link.click();
      await expect(page).toHaveURL(`/topics/${topic.slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
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

  test('reuses heading hierarchy from Accessibility and SEO', async ({ page }) => {
    for (const section of ['accessibility', 'seo']) {
      await page.goto(`/sections/${section}`);
      await page.getByRole('main').getByRole('link', { name: 'Heading hierarchy', exact: true }).click();
      await expect(page).toHaveURL('/topics/heading-hierarchy');
      const header = page.getByRole('article').locator(':scope > header');
      await expect(header.getByRole('link', { name: 'Accessibility', exact: true })).toBeVisible();
      await expect(header.getByRole('link', { name: 'SEO', exact: true })).toBeVisible();
    }
  });

  test('operates reading controls with the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard reading is checked in the desktop project');
    await page.goto('/topics/keyboard-interactions');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();

    const panel = page.getByRole('region', { name: 'Visual', exact: true });
    const code = panel.getByRole('tab', { name: 'Code', exact: true });
    await code.focus();
    await page.keyboard.press('ArrowRight');
    await expect(panel.getByRole('tab', { name: 'Diagram', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(code).toHaveAttribute('aria-selected', 'true');
    const pre = panel.locator('pre').first();
    for (let step = 0; step < 4 && !(await pre.evaluate((element) => element === document.activeElement)); step++) {
      await page.keyboard.press('Tab');
    }
    await expect(pre).toBeFocused();

    const question = page.locator('.topic-body > details').first();
    await question.locator(':scope > summary').focus();
    await page.keyboard.press('Enter');
    await expect(question).toHaveAttribute('open', '');
    await page.keyboard.press('Enter');
    await expect(question).not.toHaveAttribute('open');
    const deepDive = page.locator('.topic-body > details').last();
    await deepDive.locator(':scope > summary').focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('heading', { name: 'References', exact: true })).toBeVisible();
  });

  test('restores focus after closing mobile navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Navigation is a drawer on small screens');
    await page.goto('/topics/focus-management');
    const opener = page.getByRole('button', { name: 'Open navigation', exact: true });
    await opener.click();
    const drawer = page.getByRole('dialog', { name: 'FE System Design', exact: true });
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('keeps the visual-accessibility topic usable at a narrow width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/topics/visual-accessibility');
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    const panel = page.getByRole('region', { name: 'Visual', exact: true });
    await expect(panel.locator('pre').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await page.getByText('Deep dive', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'References', exact: true })).toBeVisible();
  });
});
