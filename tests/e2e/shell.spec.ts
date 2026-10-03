import { expect, test } from '@playwright/test';

test('billing remote renders under /billing', async ({ page }) => {
  await page.goto('/billing');
  const billing = page.getByTestId('billing-page');
  await expect(billing).toBeVisible();
  await expect(billing.getByRole('heading', { name: 'Billing' })).toBeVisible();
  await expect(billing.getByRole('row')).toHaveCount(5);
});

test('catalog remote renders and its filter narrows the cards', async ({ page }) => {
  await page.goto('/catalog');
  await expect(page.getByTestId('catalog-page')).toBeVisible();
  const cards = page.getByTestId('product-card');
  await expect(cards).toHaveCount(6);
  await page.getByLabel('Filter products').fill('desk');
  await expect(cards).toHaveCount(3);
  await page.getByLabel('Filter products').fill('zzz');
  await expect(cards).toHaveCount(0);
  await expect(page.getByText('No products match')).toBeVisible();
});

test('client-side navigation uses real links', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Billing' }).click();
  await expect(page).toHaveURL(/\/billing$/);
  await expect(page.getByTestId('billing-page')).toBeVisible();
  await page.getByRole('link', { name: 'Catalog' }).click();
  await expect(page.getByTestId('catalog-page')).toBeVisible();
});

test('unknown routes show Not found', async ({ page }) => {
  await page.goto('/nope');
  await expect(page.getByText('Not found')).toBeVisible();
});

test('theme toggle switches the ThemeProvider root to dark', async ({ page }) => {
  await page.goto('/');
  const root = page.getByTestId('theme-root');
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the Pay now dialog from the billing remote opens inside the dark theme', async ({ page }) => {
  await page.goto('/billing');
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await page.getByRole('button', { name: 'Pay now' }).click();
  const dialog = page.getByRole('dialog', { name: 'Confirm payment' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => el.closest('[data-theme]')?.getAttribute('data-theme'))).toBe('dark');
});
