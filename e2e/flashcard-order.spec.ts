import { expect, test } from './fixtures';

test('continues with the first remaining question after learning a reviewed topic', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem(
      'system-design-checklist',
      JSON.stringify({
        state: { topics: { 'server-side-rendering': 'review', 'client-side-rendering': 'review' } },
        version: 2,
      }),
    ),
  );
  await page.goto('/flashcards');
  await page.getByRole('radio', { name: 'Review again', exact: true }).click();
  await page.getByRole('button', { name: 'Next card', exact: true }).click();
  await page.getByRole('button', { name: 'Next card', exact: true }).click();
  await page.getByRole('button', { name: 'Mark topic learned', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'When is client-side rendering the right choice?', exact: true }),
  ).toBeFocused();
  await expect(page.getByRole('status')).toHaveText('Card 1 of 3');
});
