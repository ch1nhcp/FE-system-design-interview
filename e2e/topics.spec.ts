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
    await page.goto('/topics/image-cdn');

    await expect(page.getByRole('heading', { level: 1, name: /CDN/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cheatsheet coming soon' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Topic navigation' }).getByRole('link', { name: /Next/ }).click();
    await expect(page).toHaveURL('/topics/image-formats');
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

test.describe('cheatsheet', () => {
  test('shows a visual panel with animation and code tabs', async ({ page }) => {
    await page.goto('/topics/long-polling');
    const panel = page.getByRole('region', { name: 'Visual' });

    await expect(panel.getByRole('tab', { name: 'Animation' })).toHaveAttribute('aria-selected', 'true');
    await expect(
      panel.getByRole('group', { name: 'Transport' }).getByRole('button', { name: 'Long polling' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await panel.getByRole('tab', { name: 'Code' }).click();
    await expect(panel.getByText('export async function longPoll')).toBeVisible();
  });

  test('folds interview answers and the deep dive until opened', async ({ page }) => {
    await page.goto('/topics/websockets');

    const answer = page.getByText('Detect it from the close event and from a heartbeat', { exact: false });
    await expect(answer).toBeHidden();
    await page.getByText('How do you handle a dropped WebSocket connection?').click();
    await expect(answer).toBeVisible();

    const references = page.getByRole('heading', { level: 3, name: 'References' });
    await expect(references).toBeHidden();
    await page.getByText('Deep dive').click();
    await expect(references).toBeVisible();
    await expect(page.getByRole('link', { name: 'RFC 6455: The WebSocket Protocol' })).toHaveAttribute(
      'target',
      '_blank',
    );
  });

  test('links related topics', async ({ page }) => {
    await page.goto('/topics/short-polling');

    await page.getByRole('region', { name: 'Related topics' }).getByRole('link', { name: 'Long polling' }).click();

    await expect(page).toHaveURL('/topics/long-polling');
  });

  test('keeps the visual next to the cheatsheet while scrolling on wide screens', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The panel sits inline on small screens');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/topics/server-sent-events');

    const panel = page.getByRole('region', { name: 'Visual' });
    const keyPoints = page.getByRole('heading', { level: 2, name: 'Key points' });
    const panelBox = await panel.boundingBox();
    const keyPointsBox = await keyPoints.boundingBox();
    expect(panelBox && keyPointsBox && panelBox.x > keyPointsBox.x + keyPointsBox.width).toBe(true);

    await page.getByRole('heading', { level: 2, name: 'Interview questions' }).scrollIntoViewIfNeeded();
    await expect(panel.getByRole('tab', { name: 'Animation' })).toBeInViewport();
  });

  test('places the visual right after the TL;DR on small screens', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Checked on the mobile project');
    await page.goto('/topics/websockets');

    const order = await page.evaluate(() => {
      const headings = [...document.querySelectorAll('h2')];
      const tldr = headings.find((heading) => heading.textContent === 'TL;DR');
      const keyPoints = headings.find((heading) => heading.textContent === 'Key points');
      const panel = document.querySelector('[aria-label="Visual"]');
      if (!tldr || !keyPoints || !panel) return null;
      const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return follows(tldr, panel) && follows(panel, keyPoints);
    });

    expect(order).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });

  test('opens the rendering animation on the strategy of each architecture topic', async ({ page }) => {
    for (const [slug, strategy] of [
      ['client-side-rendering', 'CSR'],
      ['server-side-rendering', 'SSR'],
      ['incremental-static-regeneration', 'SSG / ISR'],
      ['server-components', 'Streaming'],
    ] as const) {
      await page.goto(`/topics/${slug}`);
      const strategies = page.getByRole('region', { name: 'Visual' }).getByRole('group', { name: 'Strategy' });
      await expect(strategies.getByRole('button', { name: strategy, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    }
  });

  test('shows a flow diagram for structural topics', async ({ page }) => {
    await page.goto('/topics/flux-architecture');

    const diagram = page.getByRole('figure', { name: 'Flux data flow' });
    await expect(diagram.getByRole('listitem')).toHaveCount(4);
    await expect(diagram.getByText('User input in the view dispatches a new action')).toBeVisible();
  });

  test('compares the transports on the section page', async ({ page }) => {
    await page.goto('/sections/real-time-updates');

    await expect(page.getByRole('heading', { level: 2, name: 'How to choose' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Server-sent events' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Chat, collaboration, games' })).toBeVisible();
  });

  test('reads every back-end API cheatsheet from its section', async ({ page }) => {
    const topics = [
      { slug: 'rest', label: 'RESTful', visual: 'Diagram' },
      { slug: 'graphql', label: 'GraphQL', visual: 'Code' },
      { slug: 'pagination', label: 'Pagination (offset vs. cursor)', visual: 'Diagram' },
      { slug: 'authentication', label: 'Authentication', visual: 'Diagram' },
      { slug: 'authorization', label: 'Authorization', visual: 'Diagram' },
    ];

    for (const topic of topics) {
      await page.goto('/sections/backend-apis');
      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { name: 'Access contract', exact: true })).toBeVisible();
      await main.getByRole('link', { name: topic.label, exact: true }).click();

      await expect(page).toHaveURL(`/topics/${topic.slug}`);
      await expect(page.getByRole('heading', { level: 2, name: 'TL;DR', exact: true })).toBeVisible();
      const panel = page.getByRole('region', { name: 'Visual', exact: true });
      await expect(panel.getByRole('tab', { name: topic.visual, exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await panel.getByRole('tab', { name: 'Code', exact: true }).click();
      await expect(panel.locator('pre').first()).toBeVisible();
      await page.getByText('Deep dive', { exact: true }).click();
      await expect(page.getByRole('heading', { name: 'References', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    }
  });

  test('reads every component API cheatsheet and its English fallback', async ({ page }) => {
    const topics = [
      { slug: 'theming', label: 'Theming config' },
      { slug: 'event-handlers', label: 'Event handlers' },
      { slug: 'render-props', label: 'Render props' },
      { slug: 'composition', label: 'Composition' },
    ];

    for (const topic of topics) {
      await page.goto('/sections/component-apis');
      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { name: 'Define the contract', exact: true })).toBeVisible();
      await main.getByRole('link', { name: topic.label, exact: true }).click();

      await expect(page).toHaveURL(`/topics/${topic.slug}`);
      const panel = page.getByRole('region', { name: 'Visual', exact: true });
      await expect(panel.getByRole('tab', { name: 'Code', exact: true })).toHaveAttribute('aria-selected', 'true');
      await expect(panel.locator('pre').first()).toBeVisible();
      await panel.getByRole('tab', { name: 'Diagram', exact: true }).click();
      await expect(panel.getByRole('figure')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

      await page.goto(`/vi/topics/${topic.slug}`);
      await expect(page.getByRole('note')).toBeVisible();
      await expect(page.locator('[lang="en"]').getByRole('heading', { name: 'TL;DR', exact: true })).toBeVisible();
    }
  });

  test('keeps batch 2 summaries within a desktop viewport', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Small screens stack the visual within the content');
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const slug of [
      'rest',
      'graphql',
      'pagination',
      'authentication',
      'authorization',
      'theming',
      'event-handlers',
      'render-props',
      'composition',
    ]) {
      await page.goto(`/topics/${slug}`);
      const body = page.locator('.topic-body');
      const tldr = await body.getByRole('heading', { name: 'TL;DR', exact: true }).boundingBox();
      const deepDive = await body.locator(':scope > details').last().boundingBox();
      expect(tldr).not.toBeNull();
      expect(deepDive).not.toBeNull();
      // The closed summary fits below the sticky header once the reader scrolls to the cheatsheet.
      expect(deepDive!.y - tldr!.y, `${slug} summary height`).toBeLessThanOrEqual(820);
    }
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
