import { expect, test as base } from '@playwright/test';

type Fixtures = {
  /** Fails the test if the page logs a console error or throws an uncaught exception. */
  consoleErrors: string[];
};

export const test = base.extend<Fixtures>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          errors.push(message.text());
        }
      });
      page.on('pageerror', (error) => errors.push(error.message));

      await use(errors);

      expect(errors, 'console errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
