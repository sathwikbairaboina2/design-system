// Builds bench/results/latest.json from real test output. Nothing here has a default: a missing input throws.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const pct = (part, whole) => (whole === 0 ? 0 : Number(((part / whole) * 100).toFixed(1)));

/** Pure: turns the raw inputs into the report. Throws if a claim in the headline would not be true. */
export function summarize(inputs) {
  const { stories, a11yStats, visualStats, contrast, singletons, remoteFailure } = inputs;
  const storyList = stories.filter((s) => s.type === 'story');
  const components = new Set(storyList.filter((s) => s.title.startsWith('Components/')).map((s) => s.title)).size;
  const storyCount = storyList.length;

  const a11y = { checks: a11yStats.expected + a11yStats.unexpected, failures: a11yStats.unexpected };
  const visual = { screenshots: visualStats.expected, failures: visualStats.unexpected, skipped: visualStats.skipped };
  const coverage = {
    visualPct: pct(visualStats.expected, storyCount * 4),
    a11yPct: pct(a11yStats.expected, storyCount * 2),
  };
  const contrastSummary = {
    pairs: new Set(contrast.map((c) => `${c.fg}|${c.bg}`)).size,
    checks: contrast.length,
    passed: contrast.filter((c) => c.pass).length,
  };

  if (singletons.uiInstanceIds !== 1 || singletons.reactLoadedVersions !== 1 || singletons.uiLoadedVersions !== 1) {
    throw new Error(`singleton proof failed: ${JSON.stringify(singletons)}`);
  }

  // A story only counts as covered when both suites cover it, so the headline uses the smaller percentage.
  const headlinePct = Math.min(coverage.visualPct, coverage.a11yPct);
  const headline =
    `${components} components, ${headlinePct}% of ${storyCount} stories under visual + a11y regression ` +
    `(${visual.screenshots} screenshots, ${a11y.failures} serious/critical axe violations), ` +
    'two independently deployed remotes sharing one React and one design system';

  return {
    generatedAt: inputs.generatedAt,
    commit: inputs.commit,
    node: inputs.node,
    components,
    stories: storyCount,
    a11y,
    visual,
    coverage,
    contrast: contrastSummary,
    singletons,
    remoteFailure,
    sizes: inputs.sizes,
    headline,
  };
}

function readJson(root, rel, hint) {
  const path = join(root, rel);
  if (!existsSync(path)) throw new Error(`missing input: ${rel} (run ${hint})`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function gzipSize(root, rel, hint) {
  const path = join(root, rel);
  if (!existsSync(path)) throw new Error(`missing input: ${rel} (run ${hint})`);
  return gzipSync(readFileSync(path)).length;
}

export function collect(root) {
  const index = readJson(root, 'apps/storybook/storybook-static/index.json', 'pnpm build');
  const a11y = readJson(root, 'tests/visual/results/a11y.json', 'pnpm test:a11y');
  const visual = readJson(root, 'tests/visual/results/visual.json', 'scripts/visual.ps1');
  const dead = readJson(root, 'tests/e2e/results/remote-dead.json', 'pnpm test:e2e');
  const slow = readJson(root, 'tests/e2e/results/remote-slow.json', 'pnpm test:e2e');
  return {
    generatedAt: new Date().toISOString(),
    commit: execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    node: process.version,
    stories: Object.values(index.entries),
    a11yStats: a11y.stats,
    visualStats: visual.stats,
    contrast: readJson(root, 'packages/tokens/dist/contrast-report.json', 'pnpm build'),
    singletons: readJson(root, 'tests/e2e/results/singletons.json', 'pnpm test:e2e'),
    remoteFailure: { timeoutMs: slow.timeoutMs, deadFallbackMs: dead.deadFallbackMs, slowFallbackMs: slow.slowFallbackMs },
    sizes: {
      uiJsGzipBytes: gzipSize(root, 'packages/ui/dist/index.js', 'pnpm build'),
      uiCssGzipBytes: gzipSize(root, 'packages/ui/dist/index.css', 'pnpm build'),
      tokensCssGzipBytes: gzipSize(root, 'packages/tokens/dist/tokens.css', 'pnpm build'),
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(import.meta.dirname, '..');
  try {
    const report = summarize(collect(root));
    const out = join(root, 'bench/results/latest.json');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
    console.log(report.headline);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
