import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';

import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://localhost:3101';
const output = process.env.AUDIT_OUTPUT_DIR ?? 'artifacts/performance';
const paths = ['/', '/topics/websockets', '/vi/framework', '/flashcards'];
const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
const results = [];
try {
  for (const pathname of paths) {
    for (let run = 1; run <= 3; run++) {
      const result = await lighthouse(new URL(pathname, baseUrl).href, {
        port,
        onlyCategories: ['performance'],
        output: 'html',
        logLevel: 'error',
      });
      const id = `${pathname === '/' ? 'home' : pathname.slice(1).replaceAll('/', '-')}-${run}`;
      await writeFile(path.join(output, `${id}.html`), result.report);
      await writeFile(path.join(output, `${id}.json`), JSON.stringify(result.lhr, null, 2));
      const metrics = {
        path: pathname,
        run,
        score: result.lhr.categories.performance.score,
        lcp: result.lhr.audits['largest-contentful-paint'].numericValue,
        cls: result.lhr.audits['cumulative-layout-shift'].numericValue,
        tbt: result.lhr.audits['total-blocking-time'].numericValue,
      };
      results.push(metrics);
      console.log(JSON.stringify(metrics));
    }
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.auditInteractions = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId) window.auditInteractions.push(entry.duration);
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
  });
  await page.goto(new URL('/flashcards', baseUrl).href);
  await page.getByRole('button', { name: 'Show answer', exact: true }).click();
  await page.getByRole('button', { name: 'Next card', exact: true }).click();
  await page.getByRole('button', { name: 'Review this topic again', exact: true }).click();
  await page.getByRole('button', { name: /Search topics/ }).click();
  await page.getByRole('combobox', { name: 'Search topics', exact: true }).pressSequentially('WebSockets');
  await page.getByRole('option').first().waitFor();
  await page.keyboard.press('Escape');
  // Event Timing entries are delivered after the interaction and its next paint.
  await page.waitForTimeout(300);
  const durations = await page.evaluate(() => window.auditInteractions);
  const summary = {
    generatedAt: new Date().toISOString(),
    lighthouseVersion: (await import('lighthouse/package.json', { with: { type: 'json' } })).default.version,
    browser: browser.version(),
    baseUrl,
    settings: 'Lighthouse default simulated mobile throttling; three cold navigations per route',
    results,
    interactionSample: {
      count: durations.length,
      maximumDurationMs: durations.length ? Math.max(...durations) : null,
      observationThresholdMs: 16,
    },
  };
  await writeFile(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.interactionSample));
} finally {
  await browser.close();
}
