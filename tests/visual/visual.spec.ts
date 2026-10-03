import { expect, test } from '@playwright/test';
import { openStory, STORIES, THEMES, VIEWPORTS } from './stories.ts';

test.skip(!process.env.DS_VISUAL, 'visual baselines run only in the pinned Docker image (ADR 0004)');

for (const story of STORIES) {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`${story.id} ${theme} ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await openStory(page, story.id, theme);
        await expect(page).toHaveScreenshot([story.id, `${theme}-${viewport.name}.png`]);
      });
    }
  }
}
