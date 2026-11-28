import { expect, test } from './fixtures';

const realtime = ['short-polling', 'long-polling', 'server-sent-events', 'websockets'];

test('reads the complete real-time section in Vietnamese without a fallback notice', async ({ page }) => {
  for (const topic of realtime) {
    await page.goto(`/vi/topics/${topic}`);
    await expect(page.getByRole('note')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Tóm tắt', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ý chính', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cân nhắc', exact: true })).toBeVisible();
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(schema.inLanguage).toBe('vi');
    await page.getByText('Đào sâu', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Tài liệu tham khảo', exact: true })).toBeVisible();
  }
  await page.goto('/vi/sections/real-time-updates');
  await expect(page.getByRole('heading', { name: 'Cách lựa chọn', exact: true })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'Trình duyệt nối lại; server phát bù theo ID', exact: true }),
  ).toBeVisible();
});

test('keeps real-time summaries within one desktop screen in both languages', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop summary and sticky panel are checked at 1440px');
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [prefix, heading] of [
    ['', 'TL;DR'],
    ['/vi', 'Tóm tắt'],
  ] as const) {
    for (const topic of realtime) {
      await page.goto(`${prefix}/topics/${topic}`);
      await page.evaluate(() => document.fonts.ready);
      const start = await page.getByRole('heading', { name: heading, exact: true }).boundingBox();
      const end = await page.locator('.topic-body > details').last().boundingBox();
      expect(start).not.toBeNull();
      expect(end).not.toBeNull();
      expect(end!.y - start!.y, `${prefix || 'en'}/${topic}`).toBeLessThanOrEqual(820);
    }
  }
});

test('searches translated questions and studies translated flashcard answers', async ({ page }) => {
  await page.goto('/vi');
  await page.getByRole('button', { name: /Tìm chủ đề/ }).click();
  await page.getByRole('combobox', { name: 'Tìm chủ đề', exact: true }).fill('khôi phục');
  await page.getByRole('option').first().click();
  await expect(page).toHaveURL('/vi/topics/server-sent-events');
  await page.goto('/vi/topics/websockets');
  await page.getByRole('button', { name: 'Cần ôn lại', exact: true }).click();
  await page.goto('/vi/flashcards');
  await page.getByRole('radio', { name: 'Cần ôn lại', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Kết nối WebSocket bị ngắt thì xử lý thế nào?', exact: true }),
  ).toHaveAttribute('lang', 'vi');
  await page.getByRole('button', { name: 'Xem đáp án', exact: true }).click();
  await expect(page.locator('#flashcard-answer')).toContainText('Nối lại bằng backoff lũy thừa kèm jitter');
  await expect(page.locator('#flashcard-answer')).toHaveAttribute('lang', 'vi');
  await page.getByRole('button', { name: 'Thẻ tiếp', exact: true }).click();
  await expect(page.locator('#flashcard-answer')).toBeHidden();
});

test('keeps translated lessons and the overview readable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const topic of realtime) {
    await page.goto(`/vi/topics/${topic}`);
    await expect(page.getByRole('heading', { name: 'Tóm tắt', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Code', exact: true }).click();
    await expect(page.locator('[data-slot="tabs-content"] pre').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await page.goto('/vi/sections/real-time-updates');
  await expect(page.getByRole('heading', { name: 'Cách lựa chọn', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
