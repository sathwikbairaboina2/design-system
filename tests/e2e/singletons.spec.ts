import { writeFileSync } from 'node:fs';
import { commit } from './commit';
import { expect, test } from '@playwright/test';

test('one React and one @sathwik/ui across shell and both remotes, and remote hooks work', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(e.message));

  await page.goto('/?mf-debug=1');
  await expect(page.getByTestId('invoice-widget')).toBeVisible();
  await expect(page.getByTestId('product-picker')).toBeVisible();

  // A hook inside a remote only works when the remote shares the host's React.
  const widget = page.getByTestId('invoice-widget');
  await widget.getByRole('button', { name: 'Show details' }).click();
  await expect(widget.getByRole('button', { name: 'Hide details' })).toBeVisible();
  const picker = page.getByTestId('product-picker');
  await picker.getByRole('button', { name: 'Desk lamp' }).click();
  await expect(picker.getByText('Selected: Desk lamp')).toBeVisible();

  const instances = await page
    .locator('[data-ui-instance]')
    .evaluateAll((els) => els.map((el) => ({ id: (el as HTMLElement).dataset.uiInstance ?? '', owner: (el as HTMLElement).dataset.owner ?? '' })));
  const ids = new Set(instances.map((i) => i.id));
  const owners = [...new Set(instances.map((i) => i.owner))].sort();
  expect(owners).toEqual(['billing', 'catalog', 'shell']);
  expect(ids.size, `UI_INSTANCE_ID values: ${[...ids].join(', ')}`).toBe(1);

  // The host's own share scope: exactly one loaded version of each singleton.
  const react = page.getByTestId('shared-react');
  const ui = page.getByTestId('shared-@sathwik/ui');
  await expect(react).toHaveAttribute('data-loaded-count', '1');
  await expect(ui).toHaveAttribute('data-loaded-count', '1');
  const reactLoadedVersions = Number(await react.getAttribute('data-loaded-count'));
  const uiLoadedVersions = Number(await ui.getAttribute('data-loaded-count'));

  expect(problems.filter((p) => /Invalid hook call|more than one copy of React/i.test(p))).toEqual([]);

  writeFileSync('results/singletons.json', `${JSON.stringify({ commit, uiInstanceIds: ids.size, owners, reactLoadedVersions, uiLoadedVersions }, null, 2)}\n`);
});
