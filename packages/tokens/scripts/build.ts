import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import StyleDictionary from 'style-dictionary';
import type { TokenTree } from '../src/resolve.ts';
import { validateTokens } from '../src/validate.ts';

const root = join(import.meta.dirname, '..');
const read = (rel: string) => JSON.parse(readFileSync(join(root, rel), 'utf8'));
const dist = join(root, 'dist');

try {
  const base: TokenTree = read('src/base.json');
  const dark: TokenTree = read('src/dark.json');
  const pairs = read('contrast-pairs.json');
  const { themes, contrast } = validateTokens({ base, dark, pairs });

  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });

  const light = new StyleDictionary({
    source: [join(root, 'src/base.json')],
    log: { verbosity: 'silent' },
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: `${dist}/`,
        files: [{ destination: 'light.css', format: 'css/variables', options: { selector: ':root', outputReferences: false } }],
      },
      js: {
        transformGroup: 'js',
        buildPath: `${dist}/`,
        files: [
          { destination: 'tokens.js', format: 'javascript/es6' },
          { destination: 'tokens.d.ts', format: 'typescript/es6-declarations' },
        ],
      },
    },
  });
  await light.buildAllPlatforms();

  const darkSd = new StyleDictionary({
    include: [join(root, 'src/base.json')],
    source: [join(root, 'src/dark.json')],
    log: { verbosity: 'silent' },
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: `${dist}/`,
        files: [
          {
            destination: 'dark.css',
            format: 'css/variables',
            filter: (t) => t.isSource,
            options: { selector: '[data-theme="dark"]' },
          },
        ],
      },
    },
  });
  await darkSd.buildAllPlatforms();

  const lightCss = readFileSync(join(dist, 'light.css'), 'utf8');
  const darkCss = readFileSync(join(dist, 'dark.css'), 'utf8');
  writeFileSync(join(dist, 'tokens.css'), `${lightCss.trimEnd()}\n\n${darkCss.trimEnd()}\n`);
  rmSync(join(dist, 'light.css'));
  rmSync(join(dist, 'dark.css'));

  const asObject = (m: Map<string, { value: string }>) => Object.fromEntries([...m].map(([k, v]) => [k, v.value]));
  writeFileSync(join(dist, 'tokens.json'), `${JSON.stringify({ light: asObject(themes.light), dark: asObject(themes.dark) }, null, 2)}\n`);
  writeFileSync(join(dist, 'contrast-report.json'), `${JSON.stringify(contrast, null, 2)}\n`);
  console.log(`tokens built: ${themes.light.size} tokens, ${contrast.length} contrast checks passed`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
