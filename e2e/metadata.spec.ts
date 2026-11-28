import { expect, test } from './fixtures';

test('delivers static localized discovery metadata and safe structured data', async ({ page }) => {
  for (const path of ['/', '/framework', '/flashcards', '/sections/security', '/topics/websockets']) {
    for (const locale of ['en', 'vi']) {
      const pathname = locale === 'en' ? path : `/vi${path === '/' ? '' : path}`;
      const response = await page.goto(pathname);
      expect(response?.headers()['x-nextjs-cache']).toBe('HIT');
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(new URL(canonical!).pathname).toBe(pathname);
      if (process.env.SITE_URL) expect(new URL(canonical!).origin).toBe(new URL(process.env.SITE_URL).origin);
      const english = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');
      const vietnamese = await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute('href');
      expect(new URL(english!).pathname).toBe(path);
      expect(new URL(vietnamese!).pathname).toBe(`/vi${path === '/' ? '' : path}`);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical!);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
      const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
      expect(new URL(schema.url).href).toBe(new URL(canonical!).href);
      expect(schema.name).not.toMatch(/<\/?code>/);
      expect(schema.description.length).toBeGreaterThan(10);
    }
  }
});

test('publishes all 196 canonical pages in the sitemap and delivers each URL', async ({ page, request, isMobile }) => {
  test.skip(isMobile, 'The sitemap is independent of device');
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const locations = await page.evaluate(
    (xml) =>
      [...new DOMParser().parseFromString(xml, 'application/xml').querySelectorAll('url > loc')].map(
        (element) => element.textContent!,
      ),
    await response.text(),
  );
  expect(new Set(locations).size).toBe(196);
  expect(locations.every((url) => !new URL(url).pathname.startsWith('/en'))).toBe(true);
  for (const url of locations) {
    expect((await request.get(new URL(url).pathname)).status(), url).toBe(200);
  }
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap:');
  expect(await robots.text()).toContain('/sitemap.xml');
  expect(await robots.text()).not.toContain('Disallow: /og/');
});

test('serves prerendered share images for English and Vietnamese pages', async ({ page, request }) => {
  for (const path of ['/', '/vi/sections/security', '/vi/topics/incremental-static-regeneration']) {
    await page.goto(path);
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    const response = await request.get(new URL(image!).pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    const png = await response.body();
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  }
  expect((await request.get('/og/vi/unknown-page')).status()).toBe(404);
});
