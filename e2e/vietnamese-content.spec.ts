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
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  }
});

test('keeps Vietnamese real-time summaries within a desktop viewport', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Small screens stack the visual within the content');
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const topic of realtime) {
    await page.goto(`/vi/topics/${topic}`);
    const body = page.locator('.topic-body');
    const tldr = await body.getByRole('heading', { name: 'Tóm tắt', exact: true }).boundingBox();
    const deepDive = await body.locator(':scope > details').last().boundingBox();
    expect(tldr).not.toBeNull();
    expect(deepDive).not.toBeNull();
    // Same one-screen budget as the English batches, leaving room for the sticky header.
    expect.soft(deepDive!.y - tldr!.y, `${topic} summary height`).toBeLessThanOrEqual(820);
  }
});
