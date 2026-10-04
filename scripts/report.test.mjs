import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { assertFresh, collect, summarize } from './report.mjs';

const stories = [
  { type: 'story', title: 'Components/Button' },
  { type: 'story', title: 'Components/Button' },
  { type: 'story', title: 'Components/Input' },
  { type: 'story', title: 'Components/Input' },
  { type: 'docs', title: 'Components/Input' },
];

const base = {
  generatedAt: '2026-10-04T00:00:00.000Z',
  commit: 'abc1234',
  node: 'v24.0.0',
  stories,
  a11yStats: { expected: 8, unexpected: 0, skipped: 0 },
  visualStats: { expected: 16, unexpected: 0, skipped: 0 },
  contrast: [
    { fg: 'a', bg: 'b', theme: 'light', pass: true },
    { fg: 'a', bg: 'b', theme: 'dark', pass: true },
  ],
  singletons: { uiInstanceIds: 1, owners: ['billing', 'catalog', 'shell'], reactLoadedVersions: 1, uiLoadedVersions: 1 },
  remoteFailure: { timeoutMs: 1500, deadFallbackMs: 300, slowFallbackMs: 1520 },
  sizes: {},
};

test('summarize computes coverage and the headline from the inputs', () => {
  const r = summarize(base);
  assert.equal(r.components, 2);
  assert.equal(r.stories, 4);
  assert.equal(r.coverage.visualPct, 100);
  assert.equal(r.coverage.a11yPct, 100);
  assert.equal(r.visual.screenshots, 16);
  assert.deepEqual(r.contrast, { pairs: 1, checks: 2, passed: 2 });
  assert.equal(
    r.headline,
    '2 components, 100% of 4 stories under visual + a11y regression (16 screenshots, 0 serious/critical axe violations), two independently deployed remotes sharing one React and one design system',
  );
});

test('failures lower the percentage and are counted', () => {
  const r = summarize({
    ...base,
    visualStats: { expected: 12, unexpected: 4, skipped: 0 },
    a11yStats: { expected: 7, unexpected: 1, skipped: 0 },
  });
  assert.equal(r.coverage.visualPct, 75);
  assert.equal(r.coverage.a11yPct, 87.5);
  assert.equal(r.a11y.failures, 1);
  assert.match(r.headline, /75% of 4 stories/);
  assert.match(r.headline, /1 serious\/critical axe violations/);
});

test('a visual run with every test skipped (host run) reports 0%, never 100%', () => {
  const r = summarize({ ...base, visualStats: { expected: 0, unexpected: 0, skipped: 16 } });
  assert.equal(r.coverage.visualPct, 0);
  assert.equal(r.visual.skipped, 16);
  assert.match(r.headline, /^2 components, 0% of 4 stories/);
});

test('refuses to claim a shared singleton when the proof says otherwise', () => {
  assert.throws(() => summarize({ ...base, singletons: { ...base.singletons, uiInstanceIds: 2 } }), /singleton proof failed/);
});

test('collect throws on a missing input instead of defaulting a number', () => {
  const empty = mkdtempSync(join(tmpdir(), 'ds-report-'));
  assert.throws(() => collect(empty), /missing input: apps\/storybook\/storybook-static\/index\.json \(run pnpm build\)/);
});

test('assertFresh accepts inputs from HEAD with no flaky tests', () => {
  assertFresh('abc1234', [
    { name: 'a11y.json', commit: 'abc1234', flaky: 0 },
    { name: 'singletons.json', commit: 'abc1234' },
  ]);
});

test('assertFresh throws when an input came from another commit', () => {
  assert.throws(
    () => assertFresh('abc1234', [{ name: 'visual.json', commit: 'old0000' }]),
    /visual\.json is from commit old0000, HEAD is abc1234/,
  );
});

test('assertFresh throws when an input carries no commit', () => {
  assert.throws(() => assertFresh('abc1234', [{ name: 'e2e.json', commit: undefined }]), /e2e\.json has no commit/);
});

test('assertFresh throws on flaky tests', () => {
  assert.throws(() => assertFresh('abc1234', [{ name: 'e2e.json', commit: 'abc1234', flaky: 2 }]), /e2e\.json has 2 flaky test/);
});
