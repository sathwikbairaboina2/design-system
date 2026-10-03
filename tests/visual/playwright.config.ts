import { defineConfig, devices } from '@playwright/test';

// Only the CLI arguments decide: argv[1] is a path that itself contains "visual".
const kind = process.argv.slice(2).some((a) => a.includes('visual.spec')) ? 'visual' : 'a11y';

export default defineConfig({
  testDir: '.',
  testMatch: /(a11y|visual)\.spec\.ts$/,
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['json', { outputFile: `results/${kind}.json` }]],
  use: { baseURL: 'http://127.0.0.1:5444' },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled', caret: 'hide' } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm exec sirv ../../apps/storybook/storybook-static --port 5444 --host 127.0.0.1',
    url: 'http://127.0.0.1:5444/index.json',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
