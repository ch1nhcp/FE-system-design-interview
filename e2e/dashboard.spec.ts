import { expect, test } from './fixtures';

test.describe('dashboard', () => {
  test('lists every section and topic', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Front End System Design Interview Prep');
    await expect(page.getByRole('heading', { level: 1, name: 'Front end system design checklist' })).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(85);
    await expect(page.getByText('0 of 81 done')).toBeVisible();
  });

  test('keeps progress after a reload', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('checkbox', { name: 'Learned: WebSockets' }).click();
    await page.getByRole('checkbox', { name: 'Learned: Long polling' }).click();
    await expect(page.getByText('2 of 81 done')).toBeVisible();

    await page.reload();

    await expect(page.getByText('2 of 81 done')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Learned: WebSockets' })).toBeChecked();
    await expect(page.getByRole('progressbar', { name: 'Checklist progress' })).toHaveAttribute('aria-valuenow', '2');
  });

  test('migrates progress saved by the first version of the checklist', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'system-design-checklist',
        JSON.stringify({ state: { checked: { 'architecture.ssr': true, 'seo.sitemap': true } }, version: 1 }),
      );
    });

    await page.goto('/');

    await expect(page.getByText('2 of 81 done')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Learned: Server-side rendering' })).toBeChecked();
  });

  test('resets progress after confirmation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'Learned: CORS' }).click();

    await page.getByRole('button', { name: 'Reset progress' }).click();
    await page.getByRole('dialog', { name: 'Reset all progress?' }).getByRole('button', { name: 'Reset' }).click();

    await expect(page.getByText('0 of 81 done')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset progress' })).toBeDisabled();
  });

  test('has no horizontal scroll', async ({ page }) => {
    await page.goto('/');

    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

    expect(overflows).toBe(false);
  });
});
