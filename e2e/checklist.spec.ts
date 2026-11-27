import { expect, test } from './fixtures';

test.describe('system design checklist', () => {
  test('shows every section and item on the homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Front End System Design Checklist');
    await expect(page.getByRole('heading', { level: 1, name: 'Front end system design checklist' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(14);
    await expect(page.getByRole('checkbox')).toHaveCount(85);
    await expect(page.getByText('0 of 85 done')).toBeVisible();
  });

  test('keeps progress after a reload', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('checkbox', { name: 'WebSockets' }).click();
    await page.getByRole('checkbox', { name: 'Long polling' }).click();
    await expect(page.getByText('2 of 85 done')).toBeVisible();

    await page.reload();

    await expect(page.getByText('2 of 85 done')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'WebSockets' })).toBeChecked();
    await expect(page.getByRole('progressbar', { name: 'Checklist progress' })).toHaveAttribute('aria-valuenow', '2');
  });

  test('resets progress after confirmation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'CORS' }).click();

    await page.getByRole('button', { name: 'Reset progress' }).click();
    await page.getByRole('dialog', { name: 'Reset all progress?' }).getByRole('button', { name: 'Reset' }).click();

    await expect(page.getByText('0 of 85 done')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset progress' })).toBeDisabled();
  });

  test('has no horizontal scroll', async ({ page }) => {
    await page.goto('/');

    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

    expect(overflows).toBe(false);
  });
});

test.describe('localization', () => {
  test('switches to Vietnamese and keeps progress', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'Server-side rendering' }).click();

    await page.getByRole('button', { name: 'EN' }).click();
    await page.getByRole('menuitemradio', { name: 'VI' }).click();

    await expect(page).toHaveURL('/vi');
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
    await expect(page.getByRole('heading', { level: 1, name: 'Checklist front end system design' })).toBeVisible();
    await expect(page.getByText('Đã xong 1/85')).toBeVisible();
  });

  test('no longer serves the Japanese locale', async ({ page }) => {
    const response = await page.request.get('/ja');

    expect(response.status()).toBe(404);
  });
});

test.describe('theme', () => {
  test('remembers dark mode across reloads', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();

    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
