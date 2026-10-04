import { expect, test } from '@playwright/test';

test('a remote built with contract 2 is refused and never mounted', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.route('**/remotes.json', async (route) => {
    const json = await (await route.fetch()).json();
    json.catalog.entry = 'http://localhost:5443/mf-manifest.json';
    await route.fulfill({ json });
  });

  await page.goto('/catalog');
  const fallback = page.getByTestId('catalog-fallback');
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText('not compatible');
  // It must stay unmounted, not flash in after the fallback.
  await page.waitForTimeout(1000);
  await expect(page.getByTestId('catalog-page')).toHaveCount(0);
  expect(errors.some((e) => e.includes('contract 2'))).toBe(true);

  await page.getByRole('link', { name: 'Billing' }).click();
  await expect(page.getByTestId('billing-page')).toBeVisible();
});
