import { expect, test } from './fixtures';

test.describe('sections and topics', () => {
  test('goes from the dashboard to a section and a topic', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Real-time updates', exact: true }).click();
    await expect(page).toHaveURL('/sections/real-time-updates');
    await expect(page.getByRole('heading', { level: 1, name: 'Real-time updates' })).toBeVisible();
    await expect(page.getByText('A persistent, two-way connection')).toBeVisible();

    await page.getByRole('main').getByRole('link', { name: 'WebSockets' }).click();
    await expect(page).toHaveURL('/topics/websockets');
    await expect(page).toHaveTitle('WebSockets | FE System Design');
    await expect(page.getByRole('heading', { level: 2, name: 'TL;DR' })).toBeVisible();
  });

  test('shows a placeholder for topics without a cheatsheet and links to neighbours', async ({ page }) => {
    await page.goto('/topics/short-polling');

    await expect(page.getByRole('heading', { level: 1, name: 'Short polling' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cheatsheet coming soon' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Topic navigation' }).getByRole('link', { name: /Next/ }).click();
    await expect(page).toHaveURL('/topics/long-polling');
  });

  test('shares progress between the topic page and the dashboard', async ({ page }) => {
    await page.goto('/topics/cors');

    await page.getByRole('checkbox', { name: 'Learned' }).click();
    await page.goto('/topics/csrf');
    await page.getByRole('button', { name: 'Review again' }).click();
    await expect(page.getByRole('button', { name: 'Review again' })).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/');

    await expect(page.getByRole('checkbox', { name: 'Learned: CORS' })).toBeChecked();
    await expect(page.getByRole('region', { name: 'Review again' }).getByRole('link', { name: 'CSRF' })).toBeVisible();
    await expect(page.getByText('1 of 81 done')).toBeVisible();
  });

  test('returns 404 for unknown sections and topics', async ({ page }) => {
    expect((await page.request.get('/topics/not-a-topic')).status()).toBe(404);
    expect((await page.request.get('/sections/not-a-section')).status()).toBe(404);
  });

  test('renders the framework and flashcards placeholders', async ({ page }) => {
    await page.goto('/framework');
    await expect(page.getByRole('heading', { level: 1, name: 'Interview framework' })).toBeVisible();

    await page.goto('/flashcards');
    await expect(page.getByRole('heading', { level: 1, name: 'Flashcards' })).toBeVisible();
  });
});

test.describe('navigation', () => {
  test('marks the current topic in the sidebar on wide screens', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The sidebar is replaced by a drawer on small screens');
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/topics/conflict-resolution');

    const current = page.getByRole('navigation', { name: 'Sections and topics' }).locator('[aria-current="page"]');
    await expect(current).toHaveText('Conflict resolution');
    await expect(current).toBeInViewport();
  });

  test('opens the drawer on small screens and closes it after navigating', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The drawer is only shown on small screens');

    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'FE System Design' });
    await drawer.getByRole('link', { name: 'XSS' }).click();

    await expect(page).toHaveURL('/topics/xss');
    await expect(drawer).toBeHidden();
  });

  test('lets keyboard users skip to the main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard navigation is checked on desktop');

    await page.goto('/topics/xss');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press('Enter');

    await expect(page.getByRole('main')).toBeFocused();
  });
});
