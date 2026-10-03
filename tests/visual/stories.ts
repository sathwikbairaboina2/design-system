import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';

export interface StoryRef {
  id: string;
  title: string;
  name: string;
}

export const THEMES = ['light', 'dark'] as const;
export type ThemeName = (typeof THEMES)[number];

export const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 800 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

const indexPath = join(import.meta.dirname, '../../apps/storybook/storybook-static/index.json');

function loadStories(): StoryRef[] {
  if (!existsSync(indexPath)) {
    throw new Error(`missing ${indexPath}: run pnpm build first`);
  }
  const index = JSON.parse(readFileSync(indexPath, 'utf8')) as {
    entries: Record<string, { id: string; title: string; name: string; type: string }>;
  };
  return Object.values(index.entries)
    .filter((e) => e.type === 'story')
    .map(({ id, title, name }) => ({ id, title, name }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Every story in the built Storybook: the list is derived from index.json, never hand-written. */
export const STORIES: StoryRef[] = loadStories();

export async function openStory(page: Page, id: string, theme: ThemeName): Promise<void> {
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  // Guard against a fake dark run: the theme under test must really be applied.
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}
