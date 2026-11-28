import { TOPIC_SLUGS } from '../src/lib/topics/registry';
import { expect, test } from './fixtures';

test('keeps every English cheatsheet within one desktop screen', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The visual is inline on mobile');
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const topic of TOPIC_SLUGS) {
    await page.goto(`/topics/${topic}`);
    await page.evaluate(() => document.fonts.ready);
    const start = await page.getByRole('heading', { name: 'TL;DR', exact: true }).boundingBox();
    const end = await page.locator('.topic-body > details').last().boundingBox();
    expect(start).not.toBeNull();
    expect(end).not.toBeNull();
    expect.soft(end!.y - start!.y, `${topic} summary height`).toBeLessThanOrEqual(820);
  }
});
