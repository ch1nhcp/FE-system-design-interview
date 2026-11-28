import { expect, test } from './fixtures';

test.describe('study tools', () => {
  test('opens search, follows a result and restores focus when dismissed', async ({ page }) => {
    await page.goto('/');
    const opener = page.getByRole('button', { name: /Search topics/ });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Search topics', exact: true });
    await expect(dialog).toBeVisible();
    await page.getByRole('combobox', { name: 'Search topics', exact: true }).fill('WebSockets');
    await expect(page.getByRole('option', { name: /WebSockets/ }).first()).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/topics/websockets');
    await page.keyboard.press('Control+k');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('searches in Vietnamese and recovers from an unavailable index', async ({ page }) => {
    let failed = false;
    await page.route('**/api/search*', async (route) => {
      if (!failed) {
        failed = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: 'invalid index' });
      } else await route.continue();
    });
    await page.goto('/vi');
    await page.getByRole('button', { name: /Tìm chủ đề/ }).click();
    await page.getByRole('combobox', { name: 'Tìm chủ đề', exact: true }).fill('WebSockets');
    await expect(page.getByRole('alert')).toContainText('Không tải được tìm kiếm');
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await page
      .getByRole('option', { name: /WebSocket/ })
      .first()
      .click();
    await expect(page).toHaveURL('/vi/topics/websockets');
  });

  test('studies authored answers and shares review progress with the dashboard', async ({ page }) => {
    await page.goto('/flashcards');
    const card = page.locator('[data-slot="card"]').first();
    const question = await card.getByRole('heading', { level: 2 }).textContent();
    const topicTitle = await card.getByRole('link').textContent();
    await page.getByRole('button', { name: 'Show answer', exact: true }).click();
    await expect(page.locator('#flashcard-answer')).toBeVisible();
    await page.getByRole('button', { name: 'Next card', exact: true }).click();
    await expect(card.getByRole('heading', { level: 2 })).not.toHaveText(question!);
    await expect(page.locator('#flashcard-answer')).toBeHidden();
    await page.getByRole('button', { name: 'Review this topic again', exact: true }).click();
    await page.goto('/');
    await expect(
      page
        .getByRole('region', { name: 'Review again', exact: true })
        .getByRole('link', { name: topicTitle!, exact: true }),
    ).toBeVisible();
    await page.getByRole('radio', { name: 'Review again', exact: true }).click();
    await expect(page.getByRole('checkbox')).toHaveCount(1);
    await page.getByRole('checkbox').click();
    await expect(page.getByRole('status')).toBeFocused();
    await page.getByRole('radio', { name: 'All topics', exact: true }).click();
    await page.getByRole('checkbox', { name: `Learned: ${topicTitle!}`, exact: true }).uncheck();
    await page.goto('/flashcards');
    await page.getByRole('button', { name: 'Review this topic again', exact: true }).click();
    await page.goto('/');
    await page.reload();
    await expect(
      page
        .getByRole('region', { name: 'Review again', exact: true })
        .getByRole('link', { name: topicTitle!, exact: true }),
    ).toBeVisible();
  });

  test('keeps a useful focus target when a review topic leaves the deck', async ({ page }) => {
    await page.goto('/flashcards');
    await page.getByRole('button', { name: 'Review this topic again', exact: true }).click();
    await page.getByRole('radio', { name: 'Review again', exact: true }).click();
    await page.getByRole('button', { name: 'Mark topic learned', exact: true }).click();
    const showAll = page.getByRole('button', { name: 'Show all cards', exact: true });
    await expect(showAll).toBeVisible();
    await expect(showAll).toBeFocused();
    await showAll.click();
    await expect(page.getByRole('button', { name: 'Show answer', exact: true })).toBeVisible();
  });

  test('operates study filters, reveal and navigation using the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Hardware keyboard flow is checked in the desktop project');
    await page.goto('/flashcards');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('combobox', { name: 'Section', exact: true })).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('combobox', { name: 'Section', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: 'All topics', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Review again', exact: true })).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Show all cards', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-slot="card-title"] h2')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Show answer', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#flashcard-answer')).toBeVisible();
    const next = page.getByRole('button', { name: 'Next card', exact: true });
    for (let step = 0; step < 12 && !(await next.evaluate((element) => element === document.activeElement)); step++)
      await page.keyboard.press('Tab');
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#flashcard-answer')).toBeHidden();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Previous card', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#flashcard-answer')).toBeHidden();
  });

  test('offers a complete RADIO guide in both languages', async ({ page }) => {
    for (const locale of ['', '/vi']) {
      await page.goto(`${locale}/framework`);
      await expect(page.locator('[data-slot="card-title"] h2')).toHaveCount(5);
      await expect(page.getByRole('link', { name: /GreatFrontEnd/ })).toHaveAttribute(
        'href',
        'https://www.greatfrontend.com/front-end-system-design-playbook/framework',
      );
      await page.locator('a[href="#requirements"]').click();
      await expect(page.locator('#requirements h2')).toBeInViewport();
    }
  });

  test('keeps study controls usable in Vietnamese at 320 pixels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/vi/flashcards');
    await expect(page.getByRole('button', { name: 'Xem đáp án', exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: 'Nhóm chủ đề', exact: true }).click();
    await page.getByRole('option', { name: 'Bảo mật', exact: true }).click();
    await page.getByRole('button', { name: 'Xem đáp án', exact: true }).click();
    await expect(page.locator('#flashcard-answer')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});
