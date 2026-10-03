import { join } from 'node:path';
import { expect, test } from '@playwright/test';

test.skip(!process.env.DS_MEDIA, 'README screenshots are only captured on demand (DS_MEDIA=1)');

const media = (name: string) => join(import.meta.dirname, '../../docs/media', name);

test.use({ viewport: { width: 1280, height: 800 } });

async function settleDashboard(page: import('@playwright/test').Page) {
  await page.goto('/');
  const widget = page.getByTestId('invoice-widget');
  await expect(widget).toBeVisible();
  await expect(page.getByTestId('product-picker')).toBeVisible();
  await widget.getByRole('button', { name: 'Show details' }).click();
  await page.getByTestId('product-picker').getByRole('button', { name: 'Monitor arm' }).click();
  await expect(page.getByText('Selected: Monitor arm')).toBeVisible();
}

test('dashboard, light', async ({ page }) => {
  await settleDashboard(page);
  await page.screenshot({ animations: 'disabled', path: media('shell-dashboard-light.png') });
});

test('dashboard, dark', async ({ page }) => {
  await settleDashboard(page);
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(page.getByTestId('theme-root')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ animations: 'disabled', path: media('shell-dashboard-dark.png') });
});

test('catalog remote down shows the fallback and the shell still works', async ({ page }) => {
  await page.route('http://localhost:5442/**', (route) => route.abort());
  await page.goto('/catalog');
  await expect(page.getByTestId('catalog-fallback')).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: media('shell-catalog-down.png') });
});

test('debug panel shows one loaded React and one @sathwik/ui', async ({ page }) => {
  await page.goto('/?mf-debug=1');
  await expect(page.getByTestId('invoice-widget')).toBeVisible();
  await expect(page.getByTestId('shared-react')).toHaveAttribute('data-loaded-count', '1');
  await expect(page.getByTestId('shared-@sathwik/ui')).toHaveAttribute('data-loaded-count', '1');
  await page.screenshot({ animations: 'disabled', path: media('shell-debug-panel.png'), fullPage: true });
});
