import { mkdirSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { commit } from './commit';

mkdirSync('results', { recursive: true });

const server = (command: string, url: string) => ({
  command,
  url,
  reuseExistingServer: !process.env.CI,
  timeout: 60_000,
});

export default defineConfig({
  testDir: '.',
  testMatch: /\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  // Locally a flake must show up as a failure; CI gets one retry and report.mjs fails on any flaky test.
  retries: process.env.CI ? 1 : 0,
  metadata: { commit },
  reporter: [['list'], ['json', { outputFile: 'results/e2e.json' }]],
  use: { baseURL: 'http://localhost:5440' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    server('pnpm --filter @ds/shell preview', 'http://localhost:5440/remotes.json'),
    server('pnpm --filter @ds/remote-billing preview', 'http://localhost:5441/mf-manifest.json'),
    server('pnpm --filter @ds/remote-catalog preview', 'http://localhost:5442/mf-manifest.json'),
    server('pnpm --filter @ds/remote-catalog preview:incompatible', 'http://localhost:5443/mf-manifest.json'),
  ],
});
