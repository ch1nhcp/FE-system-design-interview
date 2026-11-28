import { expect, test } from './fixtures';

test.describe('localization', () => {
  test('switches to Vietnamese and keeps progress', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'Learned: Server-side rendering' }).click();

    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await page.getByRole('menuitemradio', { name: 'VI' }).click();

    await expect(page).toHaveURL('/vi');
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
    await expect(page.getByRole('heading', { level: 1, name: 'Checklist front end system design' })).toBeVisible();
    await expect(page.getByText('1 of 81 done')).toBeHidden();
    await expect(page.getByRole('checkbox', { name: 'Đã học: Server-side rendering (SSR)' })).toBeChecked();
  });

  test('shows English content with a notice when a topic is not translated', async ({ page }) => {
    await page.goto('/vi/topics/https');

    await expect(page.getByRole('note')).toHaveText(
      'Chủ đề này chưa có bản tiếng Việt nên đang hiển thị bằng tiếng Anh.',
    );
    await expect(page.getByRole('heading', { level: 2, name: 'TL;DR' })).toBeVisible();
    await expect(page.locator('[lang="en"]').first()).toBeVisible();
  });

  test('shows no notice in English', async ({ page }) => {
    await page.goto('/topics/websockets');

    await expect(page.getByRole('note')).toHaveCount(0);
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
