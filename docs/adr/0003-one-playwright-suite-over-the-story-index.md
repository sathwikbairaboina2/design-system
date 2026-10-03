# ADR 0003: One Playwright suite over Storybook's index.json for a11y and visual tests

Date: 2026-10-04 · Status: accepted

## Context
Storybook 10 offers the test-runner and the Vitest addon. Both add a runner, a browser setup and their own
version coupling. We need axe checks and screenshots for 100% of stories, and a countable number for the README.

## Decision
`storybook build` writes `apps/storybook/storybook-static/index.json`. `tests/visual/stories.ts` reads it and keeps
every entry with `type === 'story'`. Two Playwright specs generate one test per story:
- `a11y.spec.ts`: axe (`@axe-core/playwright` 4.13.0) in light and dark; fails on any serious or critical violation.
- `visual.spec.ts`: `toHaveScreenshot` per story x {light, dark} x {375, 1280}; runs only when `DS_VISUAL=1`.

Coverage is 100% by construction, because the tests come from the same index Storybook serves.
Keyboard and focus behaviour is tested in Vitest (`*.test.tsx`), not in Storybook `play` functions.

## What I gave up
- **`play` functions as tests.** Stories do not use `play`; interactions live in Vitest.
- **Panel parity.** The Storybook a11y panel and the suite both use axe, but the suite's configuration lives in
  `tests/visual`, so the two can drift.
