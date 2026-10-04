// Packs the two publishable packages, checks tarball contents, imports the tokens package from the tarball
// and type-checks the ui tarball as a strict nodenext consumer (skipLibCheck off) so d.ts regressions fail.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const tmp = mkdtempSync(join(tmpdir(), 'ds-pack-'));

const REQUIRED = {
  '@sathwik/tokens': {
    dir: 'packages/tokens',
    files: ['package/dist/tokens.css', 'package/dist/tokens.js', 'package/dist/tokens.d.ts', 'package/dist/tokens.json'],
  },
  '@sathwik/ui': {
    dir: 'packages/ui',
    files: ['package/dist/index.js', 'package/dist/index.css', 'package/dist/types/index.d.ts'],
  },
};

const opts = (cwd) => ({ cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const run = (cmd, args, cwd) => execFileSync(cmd, args, opts(cwd));
// Run pnpm through node when launched by pnpm (npm_execpath), so no shell is needed on Windows.
const pnpm = (args, cwd) =>
  process.env.npm_execpath
    ? run(process.execPath, [process.env.npm_execpath, ...args], cwd)
    : execFileSync('pnpm', args, { ...opts(cwd), shell: process.platform === 'win32' });

function fail(message) {
  console.error(`pack:smoke FAILED: ${message}`);
  process.exitCode = 1;
}

// Extracts the ui tarball into a scratch consumer (module/moduleResolution nodenext, skipLibCheck false)
// and type-checks a file that must reject an invalid Button variant.
function typecheckConsumer(uiDir, tokensDir) {
  const uiRoot = join(root, 'packages/ui');
  const consumer = join(tmp, 'consumer');
  const modules = join(consumer, 'node_modules');
  mkdirSync(join(modules, '@sathwik'), { recursive: true });
  mkdirSync(join(modules, '@types'), { recursive: true });
  mkdirSync(join(modules, '@radix-ui'), { recursive: true });
  cpSync(join(uiDir, 'package'), join(modules, '@sathwik/ui'), { recursive: true });
  cpSync(join(tokensDir, 'package'), join(modules, '@sathwik/tokens'), { recursive: true });
  const link = (rel) => symlinkSync(join(uiRoot, 'node_modules', rel), join(modules, rel), 'junction');
  for (const rel of ['react', '@types/react', '@radix-ui/react-dialog', '@radix-ui/react-tabs']) link(rel);

  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }));
  writeFileSync(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'nodenext',
        moduleResolution: 'nodenext',
        target: 'ES2022',
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        types: [],
      },
      include: ['index.tsx'],
    }),
  );
  writeFileSync(
    join(consumer, 'index.tsx'),
    [
      "import { Button, ThemeProvider, type ButtonProps } from '@sathwik/ui';",
      "export const ok: ButtonProps = { variant: 'primary', children: 'x' };",
      "// @ts-expect-error an invalid variant must be a type error, not any",
      "export const bad: ButtonProps = { variant: 'nope' };",
      "export const el = <ThemeProvider theme=\"light\"><Button variant=\"primary\">Go</Button></ThemeProvider>;",
      '',
    ].join('\n'),
  );
  const tsc = join(dirname(createRequire(join(uiRoot, 'package.json')).resolve('typescript/package.json')), 'bin/tsc');
  try {
    run(process.execPath, [tsc, '-p', 'tsconfig.json'], consumer);
  } catch (e) {
    throw new Error(`nodenext consumer type-check failed:
${String(e.stdout ?? '')}${String(e.stderr ?? '')}`.slice(0, 2000));
  }
}

try {
  const summary = [];
  let tokensDir;
  let uiDir;
  for (const [name, { dir: pkgDir, files }] of Object.entries(REQUIRED)) {
    const before = new Set(readdirSync(tmp));
    pnpm(['pack', '--pack-destination', tmp], join(root, pkgDir));
    const tgz = readdirSync(tmp).find((f) => f.endsWith('.tgz') && !before.has(f));
    if (!tgz) throw new Error(`${name}: pnpm pack produced no tarball`);

    // Relative names with cwd=tmp: GNU tar would read "C:" as a remote host.
    const listing = run('tar', ['-tzf', tgz], tmp).split(/\r?\n/).map((l) => l.trim());
    for (const required of files) {
      if (!listing.includes(required)) throw new Error(`${name}: ${tgz} is missing ${required}`);
    }

    const dir = join(tmp, `x-${tgz.replace('.tgz', '')}`);
    mkdirSync(dir);
    run('tar', ['-xzf', tgz, '-C', dir], tmp);
    const pkg = JSON.parse(readFileSync(join(dir, 'package/package.json'), 'utf8'));
    const bad = JSON.stringify(pkg, null, 1).split('\n').filter((l) => l.includes('workspace:'));
    if (bad.length > 0) throw new Error(`${name}: packed package.json still has workspace: ranges: ${bad.join(' ')}`);
    if (name === '@sathwik/tokens') tokensDir = dir;
    if (name === '@sathwik/ui') uiDir = dir;
    summary.push(`${tgz} ${statSync(join(tmp, tgz)).size} bytes`);
  }

  const tokens = await import(pathToFileURL(join(tokensDir, 'package/dist/tokens.js')).href);
  if (!/^#[0-9a-f]{6}$/i.test(String(tokens.ColorBgSurface))) {
    throw new Error(`tokens.ColorBgSurface is ${JSON.stringify(tokens.ColorBgSurface)}, expected a #rrggbb colour`);
  }
  typecheckConsumer(uiDir, tokensDir);
  console.log(`pack:smoke ok (${summary.join(', ')})`);
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
