import { writeFileSync } from 'node:fs';
import { commit } from './commit';
import { expect, test, type Page } from '@playwright/test';

const round1 = (n: number) => Math.round(n * 10) / 10;

const fallbackMs = (page: Page, remote: string) =>
  page.evaluate((r) => performance.measure(`m-${r}`, `mf:${r}:start`, `mf:${r}:fallback`).duration, remote);

test('a dead remote shows a fallback quickly, the other remote keeps working, Retry recovers', async ({ page }) => {
  await page.route('http://localhost:5442/**', (route) => route.abort());

  await page.goto('/catalog');
  const fallback = page.getByTestId('catalog-fallback');
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText('Catalog is unavailable');
  const deadFallbackMs = round1(await fallbackMs(page, 'catalog'));

  // The shell and the billing remote are unaffected.
  await page.getByRole('link', { name: 'Billing' }).click();
  await expect(page.getByTestId('billing-page')).toBeVisible();
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm payment' })).toBeVisible();
  await page.keyboard.press('Escape');

  // Back to the dead remote, bring it back, Retry.
  await page.getByRole('link', { name: 'Catalog' }).click();
  await expect(page.getByTestId('catalog-fallback')).toBeVisible();
  await page.unroute('http://localhost:5442/**');
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByTestId('catalog-page')).toBeVisible();

  writeFileSync('results/remote-dead.json', `${JSON.stringify({ commit, deadFallbackMs }, null, 2)}\n`);
});

test('a slow remote is cut off at timeoutMs and billing still renders', async ({ page }) => {
  const timeoutMs = 1500;
  await page.route('**/remotes.json', async (route) => {
    const json = await (await route.fetch()).json();
    json.catalog.timeoutMs = timeoutMs;
    await route.fulfill({ json });
  });
  await page.route('http://localhost:5442/mf-manifest.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    await route.continue().catch(() => {});
  });

  await page.goto('/catalog');
  const fallback = page.getByTestId('catalog-fallback');
  await expect(fallback).toBeVisible({ timeout: 6000 });
  await expect(fallback).toContainText('longer than 1.5 s');
  const slowFallbackMs = round1(await fallbackMs(page, 'catalog'));
  expect(slowFallbackMs).toBeGreaterThanOrEqual(timeoutMs - 50);
  expect(slowFallbackMs).toBeLessThanOrEqual(timeoutMs + 500);

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByTestId('invoice-widget')).toBeVisible();

  writeFileSync('results/remote-slow.json', `${JSON.stringify({ commit, timeoutMs, slowFallbackMs }, null, 2)}\n`);
});
