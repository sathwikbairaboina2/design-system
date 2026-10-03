import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStory, STORIES, THEMES } from './stories.ts';

// Storybook's own a11y addon runs axe in the same iframe after render; two runs at once throw
// "Axe is already running". Wait for the addon to finish and retry, never skip a rule.
async function analyze(page: Page) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await new AxeBuilder({ page }).include('body').analyze();
    } catch (e) {
      if (attempt >= 8 || !/already running/.test(String(e))) throw e;
      await page.waitForTimeout(250);
    }
  }
}

for (const story of STORIES) {
  for (const theme of THEMES) {
    test(`${story.id} ${theme}`, async ({ page }) => {
      await openStory(page, story.id, theme);
      const results = await analyze(page);
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious, JSON.stringify(serious.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))).toEqual([]);
    });
  }
}
