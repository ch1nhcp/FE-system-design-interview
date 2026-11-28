import { expect, test } from './fixtures';

const realtime = ['short-polling', 'long-polling', 'server-sent-events', 'websockets'];
const foundations = [
  'server-side-rendering',
  'client-side-rendering',
  'incremental-static-regeneration',
  'serverless',
  'edge-computing',
  'server-components',
  'event-sourcing',
  'flux-architecture',
  'normalized-state',
];

const apis = [
  'rest',
  'graphql',
  'pagination',
  'authentication',
  'authorization',
  'theming',
  'event-handlers',
  'render-props',
  'composition',
];

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

test('keeps every translated summary within one desktop screen', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop summary and sticky panel are checked at 1440px');
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const topic of [...realtime, ...foundations, ...apis]) {
    await page.goto(`/vi/topics/${topic}`);
    await page.evaluate(() => document.fonts.ready);
    const start = await page.getByRole('heading', { name: 'Tóm tắt', exact: true }).boundingBox();
    const end = await page.locator('.topic-body > details').last().boundingBox();
    expect(start).not.toBeNull();
    expect(end).not.toBeNull();
    expect(end!.y - start!.y, topic).toBeLessThanOrEqual(820);
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
  for (const topic of [...realtime, ...foundations, ...apis]) {
    await page.goto(`/vi/topics/${topic}`);
    await expect(page.getByRole('heading', { name: 'Tóm tắt', exact: true })).toBeVisible();
    const codeTab = page.getByRole('tab', { name: 'Code', exact: true });
    if (await codeTab.count()) await codeTab.click();
    await expect(page.locator('[data-slot="tabs-content"] pre').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await page.goto('/vi/sections/real-time-updates');
  await expect(page.getByRole('heading', { name: 'Cách lựa chọn', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

for (const { group, topics, overviews } of [
  {
    group: 'Architecture and State management',
    topics: foundations,
    overviews: [
      ['architecture', 'Chọn chiến lược render'],
      ['state-management', 'Chọn cách tổ chức state'],
    ],
  },
  {
    group: 'Back end and Component APIs',
    topics: apis,
    overviews: [
      ['backend-apis', 'Hợp đồng truy cập'],
      ['component-apis', 'Xác định hợp đồng'],
    ],
  },
]) {
  test(`reads ${group} with translated examples and metadata`, async ({ page }) => {
    test.setTimeout(90_000);
    for (const topic of topics) {
      await page.goto(`/vi/topics/${topic}`);
      await expect(page.getByRole('note')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Tóm tắt', exact: true })).toBeVisible();
      const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
      expect(schema.inLanguage).toBe('vi');
      const panel = page.getByRole('region', { name: 'Hình minh hoạ', exact: true });
      const diagram = panel.getByRole('tab', { name: 'Sơ đồ', exact: true });
      if (await diagram.count()) {
        await diagram.click();
        await expect(panel.getByRole('figure')).toBeVisible();
      }
      const code = panel.getByRole('tab', { name: 'Code', exact: true });
      if (await code.count()) await code.click();
      await expect(panel.locator('pre').first()).toBeVisible();
      await page.getByText('Đào sâu', { exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Tài liệu tham khảo', exact: true })).toBeVisible();
    }
    for (const [section, heading] of overviews) {
      await page.goto(`/vi/sections/${section}`);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
  });
}

test('shares translated Event sourcing across sections, search and flashcards', async ({ page }) => {
  for (const section of ['state-management', 'common-patterns']) {
    await page.goto(`/vi/sections/${section}`);
    await expect(page.getByRole('main').locator('a[href="/vi/topics/event-sourcing"]')).toHaveCount(1);
  }
  await page.getByRole('button', { name: /Tìm chủ đề/ }).click();
  await page.getByRole('combobox', { name: 'Tìm chủ đề', exact: true }).fill('bù trừ');
  await page.getByRole('option', { name: /Event sourcing/ }).click();
  await expect(page).toHaveURL('/vi/topics/event-sourcing');
  await page.getByRole('button', { name: 'Cần ôn lại', exact: true }).click();
  await page.goto('/vi/flashcards');
  await page.getByRole('radio', { name: 'Cần ôn lại', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Event sourcing xuất hiện ở front end như thế nào?', exact: true }),
  ).toHaveAttribute('lang', 'vi');
  await page.getByRole('button', { name: 'Xem đáp án', exact: true }).click();
  await expect(page.locator('#flashcard-answer')).toContainText('Redux devtools phát lại action');
});

test('keeps a long sticky code panel within the viewport and scrollable by keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Code is inline with the lesson on small screens');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/vi/topics/normalized-state');
  const panel = page.getByRole('tabpanel');
  await expect(panel).toHaveAccessibleName('Code');
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeLessThanOrEqual(740);
  await panel.focus();
  await page.keyboard.press('End');
  await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
});

test('finds Vietnamese access guidance and studies its actual translated answer', async ({ page }) => {
  await page.goto('/vi');
  await page.getByRole('button', { name: /Tìm chủ đề/ }).click();
  await page.getByRole('combobox', { name: 'Tìm chủ đề', exact: true }).fill('chéo tenant');
  await page.getByRole('option', { name: /Phân quyền/ }).click();
  await expect(page).toHaveURL('/vi/topics/authorization');
  await page.getByRole('button', { name: 'Cần ôn lại', exact: true }).click();
  await page.goto('/vi/flashcards');
  await page.getByRole('radio', { name: 'Cần ôn lại', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vì sao ẩn nút admin là chưa đủ?', exact: true })).toHaveAttribute(
    'lang',
    'vi',
  );
  await page.getByRole('button', { name: 'Xem đáp án', exact: true }).click();
  await expect(page.locator('#flashcard-answer')).toContainText('kiểm tra quyền trên đúng tài nguyên');
  await expect(page.locator('#flashcard-answer')).toHaveAttribute('lang', 'vi');
});
