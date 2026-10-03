# Design system v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a pnpm monorepo where DTCG tokens (contrast-validated) feed a typed React library on CSS variables, documented in Storybook and guarded by axe + visual tests over every story, consumed by two Module Federation remotes inside one shell that shares a single React and a single `@sathwik/ui`, with a measured README headline.

**Architecture:** `packages/tokens` (validator + Style Dictionary) -> `packages/ui` (Vite lib, CSS Modules, Radix) -> `apps/storybook` (stories as fixtures) -> `tests/visual` (Playwright over `index.json`). `packages/federation-contract` defines what remotes expose and how the shell loads them; `apps/shell`, `apps/remote-billing`, `apps/remote-catalog` build with Rsbuild + `@module-federation/rsbuild-plugin`; `tests/contract` checks built manifests, `tests/e2e` drives the composed app.

**Tech Stack:** Node 24, pnpm 9.12.0, React 19.3.0, TypeScript 6.0.3, Vite 8.3.2, Vitest 5.0.3, Style Dictionary 5.6.0, Radix, Storybook 10.6.1, Playwright 1.63.0, Rsbuild 2.2.11, Module Federation 2.9.2, ESLint 9.39.5. Full pin list: spec section "Pinned toolchain".

**Spec:** `docs/superpowers/specs/2026-10-04-design-system.md` (read it first: scope, invariants, prototype findings). **ADRs:** `docs/adr/0001`-`0010`. **Ledger:** `.superpowers/sdd/2026-10-04-design-system/progress.md`.

## Global Constraints

- Repo root: `C:\Users\sathwik\projects\taskarinchu\design-system` (its own git repo, branch `main`). Never edit sibling folders under `taskarinchu\`. You may read `..\co-author` (a Vite/React/Playwright sibling) for style.
- Node and pnpm run on the host (`node -v` -> v24.18.0, `pnpm -v` -> 9.12.0). Commands below are run from the repo root unless a `cd` is shown. Use PowerShell or Git Bash; both work.
- **Write files with the Write tool, not shell heredocs** (heredocs in the Bash tool have mangled backslashes and quotes in sibling sessions).
- **Exact versions only** in every `package.json` (no `^`/`~`) except peer ranges and `workspace:` links. Use the versions in the spec. Do not add a dependency that is not in the spec without a `Ruling:` line in the ledger (name, version you checked with `npm view <pkg>@<v> version`, why).
- package.json scripts run under `cmd.exe` on Windows: no `VAR=x cmd` prefixes, no `rm -rf`, no single quotes for arguments. Use config files or `node -e` instead.
- Every tsconfig sets `"types"` explicitly (TS 6 defaults `types` to `[]`), `"strict": true`, `"moduleResolution": "bundler"`, `"module": "ESNext"`, `"target": "ES2022"`, `"jsx": "react-jsx"`, `"skipLibCheck": true`, `"verbatimModuleSyntax": true`. Build scripts in `.ts` run with plain `node` (Node 24 strips types): use only erasable syntax (`"erasableSyntaxOnly": true`, `"allowImportingTsExtensions": true` where `.ts` is imported) and `.ts` extensions in relative imports of those scripts.
- Ports 5440-5449 only: 5440 shell, 5441 billing, 5442 catalog, 5443 catalog-incompatible, 5444 Storybook. Every dev/preview server uses `strictPort`. Stop every server and container you start (on Windows: `Get-NetTCPConnection -LocalPort 5440,5441,5442,5443,5444 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`).
- Docker names start with `design-system-`. Run containers with `--rm`. `docker compose` project name is `design-system`.
- TDD: write the failing test, run it and see it fail for the right reason, implement, see it pass. Record "red seen" in the ledger line.
- Never invent numbers. README and DEVDOCS numbers come only from `bench/results/latest.json` written by `pnpm report` after real runs.
- No secrets, no `.env` files. No network calls in tests (Playwright talks only to localhost).
- Commits: allowed, local only. Never push or add a remote. One conventional commit per task (subject given in the task). Stage explicit paths, run `git status --short` first, never stage `node_modules`, `dist`, `.superpowers/` or `*.tgz`. Message body ends with a blank line and `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. If a permission check blocks `git commit`, do not work around it: add a `Ruling:` line and continue.
- Ledger: after each task append `Task N: complete (<commands run> -> <result>; red seen)` to `.superpowers/sdd/2026-10-04-design-system/progress.md`. Decisions you make go in as `Ruling: <decision> - <why> - <cost>`. If you stop early, the next builder resumes from the first task without a `complete` line.
- Pipe noisy output through `Select-Object -Last 20` / `tail -20`.

## Review Focus (the lead will check these first)

1. **Fake dark-mode tests.** a11y and visual tests must assert `html[data-theme]` equals the theme under test before running axe or taking a screenshot (Tasks 13, 14).
2. **Coverage by construction.** Story lists come from `storybook-static/index.json`, never a hard-coded list (Task 13).
3. **Singleton proof is real.** `UI_INSTANCE_ID` values collected from shell, billing and catalog DOM nodes must be one value, and a hook in a remote must update on click (Task 20).
4. **Timeout really races.** `loadRemoteSafely` must reject at `timeoutMs` while the loader is still pending, and clear its timer on success (Task 15). The slow-remote e2e measures with `performance.measure` (Task 21).
5. **Contract test can fail.** `tests/contract` has a negative test against a doctored manifest fixture (Task 19).
6. **Measured headline only.** `scripts/report.mjs` throws when an input file is missing; it never defaults a number (Task 24).

## File Structure

```
design-system/
  package.json  pnpm-workspace.yaml  pnpm-lock.yaml  tsconfig.base.json  eslint.config.js
  .gitignore  .gitattributes  .dockerignore  .nvmrc  docker-compose.yml  README.md
  packages/
    tokens/        package.json tsconfig.json vitest.config.ts
                   src/base.json src/dark.json contrast-pairs.json
                   src/contrast.ts src/resolve.ts src/validate.ts src/index.ts
                   scripts/build.ts   test/*.test.ts  test/fixtures/*.json
                   dist/ tokens.css tokens.js tokens.d.ts tokens.json contrast-report.json (generated, ignored)
    eslint-plugin/ package.json src/index.js src/rules/no-raw-design-values.js test/no-raw-design-values.test.ts vitest.config.ts
    ui/            package.json tsconfig.json tsconfig.build.json vite.config.ts src/setup.ts src/css.d.ts
                   src/index.ts src/instance.ts
                   src/<Component>/<Component>.tsx .module.css .test.tsx   (ThemeProvider Stack Inline Button Input Badge Card EmptyState Dialog Tabs)
    federation-contract/ package.json tsconfig.json vitest.config.ts src/index.ts src/load.ts test/load.test.ts
  apps/
    storybook/     package.json .storybook/main.ts .storybook/preview.tsx stories/*.stories.tsx tsconfig.json
    shell/         package.json rsbuild.config.ts tsconfig.json vitest.config.ts public/remotes.json
                   src/index.tsx src/bootstrap.tsx src/App.tsx src/router.ts src/registry.ts
                   src/RemoteRoute.tsx src/DebugPanel.tsx src/global.css src/*.test.tsx
    remote-billing/ package.json rsbuild.config.ts tsconfig.json src/index.tsx src/bootstrap.tsx
                   src/BillingPage.tsx src/InvoiceWidget.tsx src/contract.ts
    remote-catalog/ same shape + rsbuild.incompatible.config.ts, src/CatalogPage.tsx src/ProductPicker.tsx
  tests/
    contract/      package.json vitest.config.ts contract.test.ts fixtures/bad-manifest.json
    e2e/           package.json playwright.config.ts shell.spec.ts singletons.spec.ts remote-failure.spec.ts
                   incompatible-remote.spec.ts media.spec.ts results/ (ignored)
    visual/        package.json playwright.config.ts stories.ts a11y.spec.ts visual.spec.ts
                   __screenshots__/ (committed)  results/ (ignored)
  docker/          visual.Dockerfile demo.Dockerfile nginx.conf
  scripts/         visual.ps1 visual.sh pack-smoke.mjs report.mjs report.test.mjs
  bench/results/latest.json   (committed, written by pnpm report)
  docs/media/*.png            (committed, written by media.spec.ts)
  .github/workflows/ci.yml  .github/workflows/pages.yml
  docs/ (spec, plan, adr/, DEVDOCS.md, handoff.md)
```

Workspace package names: `@sathwik/tokens`, `@sathwik/ui` (publishable, version `0.1.0`); private: `@ds/eslint-plugin`, `@ds/federation-contract`, `@ds/storybook`, `@ds/shell`, `@ds/remote-billing`, `@ds/remote-catalog`, `@ds/contract-tests`, `@ds/e2e-tests`, `@ds/visual-tests`.

## Gates (run before claiming the build DONE; the lead re-runs them)

```powershell
pnpm install --frozen-lockfile
pnpm build                      # tokens, contract, ui, storybook, shell, both remotes (+ incompatible)
pnpm lint                       # 0 problems
pnpm typecheck                  # 0 errors
pnpm test                       # vitest in packages/* and apps/shell, plus node --test scripts/
pnpm test:contract
pnpm test:a11y                  # host, Playwright chromium
pnpm test:e2e                   # host, starts previews on 5440-5443
powershell -NoProfile -File scripts/visual.ps1    # Docker, compares baselines; exit 0
pnpm pack:smoke                 # prints "pack:smoke ok"
pnpm report                     # writes bench/results/latest.json, prints the headline
docker run --rm -v "${PWD}:/repo" -w /repo rhysd/actionlint:1.7.7 -color   # no output, exit 0
```

---

### Task 1: Scaffold the monorepo

**Files:** create `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.nvmrc`, `.dockerignore`; extend `.gitignore` and `.gitattributes` (they exist from planning; keep their lines).

- [ ] Root `package.json`:
```json
{
  "name": "design-system",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=24" },
  "scripts": {
    "tokens:build": "pnpm --filter @sathwik/tokens build",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "lint": "eslint .",
    "test": "pnpm -r --filter \"./packages/**\" --filter @ds/shell test && node --test scripts/",
    "test:contract": "pnpm --filter @ds/contract-tests test",
    "test:a11y": "pnpm --filter @ds/visual-tests test:a11y",
    "test:visual": "pnpm --filter @ds/visual-tests test:visual",
    "test:e2e": "pnpm --filter @ds/e2e-tests test",
    "storybook": "pnpm --filter @ds/storybook dev",
    "dev:mf": "pnpm --parallel --filter @ds/shell --filter @ds/remote-billing --filter @ds/remote-catalog dev",
    "pack:smoke": "node scripts/pack-smoke.mjs",
    "report": "node scripts/report.mjs"
  },
  "devDependencies": { "typescript": "6.0.3", "@types/node": "26.6.4" }
}
```
- [ ] `pnpm-workspace.yaml`: `packages: ["packages/*", "apps/*", "tests/*"]`. `.nvmrc`: `24`.
- [ ] `tsconfig.base.json` with the compiler options from Global Constraints (no `include`).
- [ ] `.dockerignore`: `.git`, `**/node_modules`, `**/dist`, `**/dist-incompatible`, `**/storybook-static`, `tests/visual/__screenshots__`, `tests/visual/results`, `tests/e2e/results`, `**/test-results`, `**/playwright-report`, `.superpowers`, `*.tgz`.
- [ ] `.gitignore` must contain: `node_modules/`, `dist/`, `dist-incompatible/`, `storybook-static/`, `test-results/`, `playwright-report/`, `tests/visual/results/`, `tests/e2e/results/`, `.superpowers/`, `*.tgz`, `.env*`, `!.env*.example`, `*.log`.
- [ ] Run `pnpm install`. Expected: `Done in`, a `pnpm-lock.yaml` exists. Run `pnpm exec tsc -v` -> `Version 6.0.3`.
- [ ] Commit `chore: scaffold pnpm workspace and shared TS config`.

### Task 2: WCAG contrast math (TDD)

**Files:** `packages/tokens/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/contrast.ts`, `test/contrast.test.ts`.

- [ ] `packages/tokens/package.json`: name `@sathwik/tokens`, version `0.1.0`, `"type": "module"`, `"files": ["dist"]`, `"exports": { ".": { "types": "./dist/tokens.d.ts", "default": "./dist/tokens.js" }, "./tokens.css": "./dist/tokens.css", "./tokens.json": "./dist/tokens.json", "./contrast-report.json": "./dist/contrast-report.json" }`, scripts `build: node scripts/build.ts`, `test: vitest run`, `typecheck: tsc -p tsconfig.json --noEmit`; devDeps `style-dictionary 5.6.0`, `vitest 5.0.3`, `typescript 6.0.3`, `@types/node 26.6.4`. tsconfig extends base, `"types": ["node"]`, `"noEmit": true`, `allowImportingTsExtensions`, `erasableSyntaxOnly`, include `src`, `scripts`, `test`.
- [ ] Test first (`test/contrast.test.ts`): `contrastRatio('#000000', '#ffffff')` = 21 (toBeCloseTo 2 dp); `('#767676','#ffffff')` = 4.54; `('#777777','#ffffff')` = 4.48; `('#1d4ed8','#ffffff')` = 6.70; order independence (`fg,bg` == `bg,fg`); `parseHex('#abc')` expands to `#aabbcc`; `parseHex('#11223380')` and `parseHex('red')` throw `/opaque #rrggbb/`.
- [ ] Run `pnpm --filter @sathwik/tokens test` -> fails (module missing). Implement `src/contrast.ts`: `parseHex`, `relativeLuminance` (WCAG 2.2: channel/255, `c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4`, `0.2126R + 0.7152G + 0.0722B`), `contrastRatio(a, b) = (Lmax+0.05)/(Lmin+0.05)`. Re-run -> all pass.
- [ ] Commit `feat(tokens): WCAG 2.2 contrast ratio`.

### Task 3: Token resolver: references, cycles, types (invariant 2)

**Files:** `src/resolve.ts`, `test/resolve.test.ts`, `test/fixtures/{broken-ref,cycle,bad-type}.json`.

- [ ] API: `type TokenTree` (DTCG nested object; a token is a node with `$value`), `flatten(tree): Map<string, { type: string; value: unknown }>` with dot paths (`color.bg.surface`), `deepMerge(base, override)`, `resolveTokens(tree): Map<string, { type: string; value: string }>`. A `$value` that is exactly `{a.b.c}` is a reference. `$type` may be inherited from an ancestor group (DTCG rule). Allowed types: `color`, `dimension`, `fontFamily`, `fontWeight`, `number`, `duration`, `shadow`. Errors (thrown `TokenError` with a `.code`): `unknown-type` (`token x: unknown $type "foo"`), `missing-type`, `broken-ref` (`token color.bg.surface: reference {color.nope} does not exist`), `cycle` (message lists the cycle path `a -> b -> a`).
- [ ] Tests first: resolves a 2-hop chain to the primitive hex; inherited group `$type`; each fixture throws the right code and names the token; `deepMerge` overrides a leaf without dropping siblings. See red, implement, see green.
- [ ] Commit `feat(tokens): resolve DTCG references with cycle and type checks`.

### Task 4: Token sources and contrast validation per theme (invariant 1)

**Files:** `src/base.json`, `src/dark.json`, `contrast-pairs.json`, `src/validate.ts`, `test/validate.test.ts`, `test/fixtures/bad-contrast-dark.json`.

- [ ] `src/base.json` (DTCG): primitives `color.neutral.{0,50,100,200,300,400,500,600,700,800,900,950}`, `color.blue.{300,400,500,600,700}`, `color.red.{300,400,600,700}`, `color.green.{400,600}`; semantic (light) `color.bg.{surface,subtle,accent,accentHover,danger}`, `color.text.{default,muted,onAccent,danger}`, `color.border.{default,input,focus}`; `space.{0,1,2,3,4,6,8}` = `0px 4px 8px 12px 16px 24px 32px`; `radius.{sm,md,lg,full}` = `4px 6px 10px 9999px`; `border.width.{1,2}` = `1px 2px`; `font.family.{sans,mono}` (system stacks as strings); `font.size.{sm,md,lg,xl}` = `13px 15px 18px 24px`; `font.weight.{regular,medium,semibold}` = `400 500 600`; `font.lineHeight.{tight,normal}` (`number`) = `1.2 1.5`; `duration.fast` = `120ms`. Semantic tokens must be references to primitives.
- [ ] `src/dark.json`: overrides for every `color.bg.*`, `color.text.*`, `color.border.*` only.
- [ ] `contrast-pairs.json` (array of `{fg, bg, min}`): text.default/bg.surface 4.5, text.default/bg.subtle 4.5, text.muted/bg.surface 4.5, text.onAccent/bg.accent 4.5, text.onAccent/bg.accentHover 4.5, text.onAccent/bg.danger 4.5, text.danger/bg.surface 4.5, border.input/bg.surface 3.0, border.focus/bg.surface 3.0, border.focus/bg.subtle 3.0 (all paths prefixed `color.`).
- [ ] `src/validate.ts`: `validateTokens({ base, dark, pairs }) => { themes: { light: Map, dark: Map }, contrast: Array<{ fg, bg, theme, ratio, min, pass }> }`. Throws `TokenError` code `contrast` listing every failing pair as `contrast: <fg> on <bg> in <theme> = <ratio 2dp> < <min>` (one per line). Colours in pairs must be `color` tokens.
- [ ] Tests first: the real sources pass and return `2 x pairs.length` results all `pass: true`; `bad-contrast-dark.json` (dark override making `text.onAccent` on `bg.accent` about 3:1) throws and the message contains `color.text.onAccent on color.bg.accent in dark`; a pair naming a non-colour token throws. Pick hex values so the real tokens pass (e.g. light accent `#1d4ed8` with white text = 6.70).
- [ ] Commit `feat(tokens): light/dark sources and per-theme contrast validation`.

### Task 5: Token build (Style Dictionary 5) and outputs

**Files:** `scripts/build.ts`, `src/index.ts` (re-exports `validateTokens`, `contrastRatio`, `resolveTokens`), `test/build.test.ts`.

- [ ] `scripts/build.ts`: read sources -> `validateTokens` (throw = exit 1 with message) -> Style Dictionary, using what the prototype proved:
```ts
import StyleDictionary from 'style-dictionary';
const light = new StyleDictionary({ source: ['src/base.json'], log: { verbosity: 'silent' }, platforms: {
  css: { transformGroup: 'css', buildPath: 'dist/', files: [{ destination: 'light.css', format: 'css/variables', options: { selector: ':root', outputReferences: false } }] },
  js: { transformGroup: 'js', buildPath: 'dist/', files: [{ destination: 'tokens.js', format: 'javascript/es6' }, { destination: 'tokens.d.ts', format: 'typescript/es6-declarations' }] } } });
await light.buildAllPlatforms();
const dark = new StyleDictionary({ include: ['src/base.json'], source: ['src/dark.json'], log: { verbosity: 'silent' }, platforms: {
  css: { transformGroup: 'css', buildPath: 'dist/', files: [{ destination: 'dark.css', format: 'css/variables', filter: (t) => t.isSource, options: { selector: '[data-theme="dark"]' } }] } } });
await dark.buildAllPlatforms();
```
  then concatenate `light.css` + `dark.css` into `dist/tokens.css` (delete the two parts), write `dist/tokens.json` (`{ light: {path: value}, dark: {path: value} }` from the validator) and `dist/contrast-report.json` (the validator's `contrast` array). If `log.verbosity` is not accepted by 5.6.0, drop it and add a Ruling.
- [ ] `test/build.test.ts` (runs the build via `execFileSync(process.execPath, ['scripts/build.ts'])` in the package dir): `tokens.css` contains `:root {` and `[data-theme="dark"] {`, `--color-bg-surface:`; every `--color-*` value in `:root` equals the validator's light value for that path and every dark-block value equals the dark value (ADR 0006 drift guard); `tokens.js` exports `ColorBgSurface`; `contrast-report.json` length = 2 x pairs.
- [ ] Run `pnpm tokens:build` -> exit 0; `pnpm --filter @sathwik/tokens test` -> all pass.
- [ ] Commit `feat(tokens): build CSS variables, typed constants and contrast report`.

### Task 6: `no-raw-design-values` ESLint rule (invariant 3)

**Files:** `packages/eslint-plugin/package.json` (`@ds/eslint-plugin`, private, `"type": "module"`, `"main": "src/index.js"`, deps `@eslint/css 1.4.0`; devDeps `eslint 9.39.5`, `vitest 5.0.3`), `src/index.js`, `src/rules/no-raw-design-values.js`, `test/no-raw-design-values.test.ts`, `vitest.config.ts`.

- [ ] Rule (plain JS, proven in the prototype): visit `Declaration`, walk `node.value.children` recursively; skip into nothing under a `Function` named `var`; report `Hash` (hex), `Function` named `rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color`, and `Dimension` with unit `px` unless value is `0`, or value is `1` and the property starts with `border` or `outline`. Message id `raw`: `Raw design value "{{value}}" in "{{property}}". Use a token variable (var(--...)).` Plugin exports `{ meta: { name: '@ds/eslint-plugin' }, rules: { 'no-raw-design-values': rule } }`.
- [ ] Test first with RuleTester inside Vitest:
```ts
import { RuleTester } from 'eslint';
import css from '@eslint/css';
import { describe, it } from 'vitest';
RuleTester.describe = describe; RuleTester.it = it; RuleTester.itOnly = it.only;
const tester = new RuleTester({ plugins: { css }, language: 'css/css' });
```
  valid: `var(--space-2)`, `margin: 0`, `border: 1px solid var(--color-border-default)`, `color: var(--x, #fff)` (fallback inside var allowed), `width: 100%`, `transition-duration: var(--duration-fast)`. invalid: `color: #fff` (1), `padding: 8px 4px` (2), `color: rgb(0 0 0)` (1), `box-shadow: 0 2px 4px oklch(0.5 0 0)` (3), `outline: 2px solid var(--color-border-focus)` (1). Named colours (`red`) are out of scope; say so in a comment at the top of the rule.
- [ ] `pnpm --filter @ds/eslint-plugin test` red then green. Commit `feat(lint): no-raw-design-values rule for CSS`.

### Task 7: Root ESLint config and `pnpm lint`

**Files:** `eslint.config.js`, root devDeps `eslint 9.39.5`, `@eslint/css 1.4.0`, `typescript-eslint 8.71.0`, `eslint-plugin-jsx-a11y 6.10.2`, `globals 17.13.0`, `@ds/eslint-plugin workspace:*`.

- [ ] Flat config: global ignores (`**/dist/**`, `**/dist-incompatible/**`, `**/storybook-static/**`, `**/node_modules/**`, `**/test-results/**`, `**/playwright-report/**`, `tests/*/results/**`); `tseslint.configs.recommended` for `**/*.{ts,tsx}`; `jsxA11y.flatConfigs.recommended` for `**/*.tsx`; `{ files: ['packages/ui/src/**/*.css', 'apps/*/src/**/*.css'], language: 'css/css', plugins: { css, ds }, rules: { 'ds/no-raw-design-values': 'error' } }`. `apps/shell/src/global.css` may use a reset; it still must not use raw colours.
- [ ] Prove the gate: create a temporary `packages/ui/src/__lint_probe.css` with `a { color: #f00; }`, run `pnpm lint` -> 1 error naming `ds/no-raw-design-values`; delete the file; `pnpm lint` -> exit 0 (no files yet is fine).
- [ ] Commit `chore(lint): root flat config with token-only CSS rule and jsx-a11y`.

### Task 8: UI package, ThemeProvider, Stack/Inline, Button (TDD)

**Files:** `packages/ui/package.json`, `tsconfig.json` (`"types": ["node"]`), `tsconfig.build.json`, `vite.config.ts`, `src/setup.ts`, `src/css.d.ts`, `src/index.ts`, `src/instance.ts`, `src/ThemeProvider/*`, `src/Stack/*` (exports `Stack` and `Inline`), `src/Button/*`.

- [ ] `package.json`: `@sathwik/ui` `0.1.0`, `"type": "module"`, `"sideEffects": ["**/*.css"]`, `"files": ["dist"]`, `"exports": { ".": { "types": "./dist/types/index.d.ts", "default": "./dist/index.js" }, "./styles.css": "./dist/index.css" }`, peerDeps `react`/`react-dom` `^19.0.0`, deps `@radix-ui/react-dialog 1.1.23`, `@radix-ui/react-tabs 1.1.21`, `@sathwik/tokens workspace:^`; devDeps react/react-dom/@types 19.3.0, vite 8.3.2, @vitejs/plugin-react 6.1.1, vitest 5.0.3, jsdom 30.1.1, @testing-library/{react 16.3.3, dom 10.4.2, user-event 14.6.7, jest-dom 7.0.1}, typescript 6.0.3. Scripts: `build: vite build && tsc -p tsconfig.build.json`, `test: vitest run`, `typecheck: tsc -p tsconfig.json --noEmit`.
- [ ] `vite.config.ts` (prototype-proven): `build.lib = { entry: 'src/index.ts', formats: ['es'], fileName: 'index' }`, `rollupOptions.external = [/^react($|\/)/, /^react-dom($|\/)/, /^@radix-ui\//]`, `cssCodeSplit: false`; `test = { environment: 'jsdom', setupFiles: ['./src/setup.ts'] }`. `tsconfig.build.json`: `emitDeclarationOnly`, `declaration`, `outDir: dist/types`, `rootDir: src`, exclude `src/**/*.test.tsx`, `src/setup.ts`. `src/setup.ts`: `import '@testing-library/jest-dom/vitest';`. `src/css.d.ts`: `declare module '*.module.css' { const classes: Record<string, string>; export default classes; }`.
- [ ] `src/instance.ts`: `export const UI_INSTANCE_ID: string = Math.random().toString(36).slice(2, 10);`
- [ ] `ThemeProvider({ theme: 'light' | 'dark', children })`: renders `<div data-theme={theme} className={s.root}>` (root sets `color`, `background`, `font-family` from tokens) and a context `{ theme, container: HTMLElement | null }` (container = that div via callback ref). Export `useTheme()`.
- [ ] `Stack({ gap = 4, as, className, ...rest })` vertical flex; `Inline` horizontal wrap; `gap` maps to `var(--space-N)` via class names (`gap-0..gap-8`), never inline px.
- [ ] `Button` (`forwardRef<HTMLButtonElement>`): props `variant: 'primary' | 'secondary' | 'ghost' | 'danger'` (default primary), `size: 'sm' | 'md'`, `loading?: boolean` (sets `aria-busy`, disables, keeps label), native button props, `className` merged. Visible focus ring uses `--color-border-focus`.
- [ ] Tests first: Button renders role button with name; `variant` class applied; `onClick` fires; `disabled`/`loading` blocks click and sets `aria-busy="true"`; ref forwards to the `<button>`; `className` is merged not replaced. ThemeProvider sets `data-theme`. Stack applies the gap class. Red, implement, green.
- [ ] `pnpm --filter @sathwik/ui build` -> `dist/index.js`, `dist/index.css`, `dist/types/index.d.ts` exist. `pnpm lint` exit 0.
- [ ] Commit `feat(ui): ThemeProvider, Stack/Inline and Button on token variables`.

### Task 9: Input, Badge, Card, EmptyState (TDD)

- [ ] `Input` (`forwardRef<HTMLInputElement>`): required `label` (rendered `<label>` linked with `useId`), optional `hint`, `error` (sets `aria-invalid`, links message with `aria-describedby`, text in `--color-text-danger`). `Badge`: `tone: 'neutral' | 'accent' | 'danger' | 'success'`. `Card`: `as` (`section` default), optional `title` (renders `h2`-level heading via `headingLevel` prop 2-4). `EmptyState`: `title`, `description`, optional `action` (ReactNode); root `role="status"`.
- [ ] Tests: label association (`getByLabelText`), error wiring (`toHaveAccessibleDescription`), `aria-invalid`; Badge tone class; Card heading level; EmptyState role and action rendered. Red then green. Export all from `src/index.ts`.
- [ ] Commit `feat(ui): Input, Badge, Card and EmptyState`.

### Task 10: Dialog and Tabs with keyboard tests (invariant 9)

- [ ] `Dialog`: wraps `@radix-ui/react-dialog` (`Root`, `Trigger asChild`, `Portal container={useTheme().container ?? undefined}`, `Overlay`, `Content`, `Title`, `Description`, `Close`). Props: `trigger: ReactElement`, `title`, `description?`, `children`, `open?`, `defaultOpen?`, `onOpenChange?`. Portalling into the ThemeProvider root keeps dark tokens inside the dialog.
- [ ] `Tabs`: wraps `@radix-ui/react-tabs`; props `items: { value, label, content }[]`, `defaultValue?`, `aria-label`.
- [ ] Tests (prototype-proven pattern with `userEvent.setup()`): Dialog opens on trigger click, first focusable inside receives focus, Tab cycles inside (focus never leaves the dialog), Escape closes, focus returns to the trigger; rendered inside `<ThemeProvider theme="dark">` the dialog content's closest `[data-theme]` is `dark`. Tabs: ArrowRight moves focus and selection to the next tab, ArrowLeft wraps from first to last, Home/End work, the active panel is the only visible one.
- [ ] File names: `src/Dialog/Dialog.test.tsx`, `src/Tabs/Tabs.test.tsx` (the spec cites these). Commit `feat(ui): Radix-based Dialog and Tabs with focus and arrow-key tests`.

### Task 11: Storybook app with theme toolbar and stories for every state

**Files:** `apps/storybook/package.json` (`@ds/storybook`, private; deps `@sathwik/ui workspace:*`, `@sathwik/tokens workspace:*`, react/react-dom 19.3.0; devDeps storybook, @storybook/react-vite, @storybook/addon-a11y, @storybook/addon-docs 10.6.1, vite 8.3.2, @vitejs/plugin-react 6.1.1, typescript 6.0.3, @types/react 19.3.0), `.storybook/main.ts`, `.storybook/preview.tsx`, `stories/*.stories.tsx`, `tsconfig.json`.

- [ ] Scripts: `dev: storybook dev -p 5444 --no-open`, `build: storybook build -o storybook-static --quiet`, `typecheck: tsc -p tsconfig.json --noEmit`.
- [ ] `main.ts`: framework `@storybook/react-vite`, stories `../stories/**/*.stories.tsx`, addons a11y + docs, `viteFinal` adds alias `@sathwik/ui` -> `path.resolve(dirname, '../../../packages/ui/src/index.ts')` so stories test source with CSS Modules.
- [ ] `preview.tsx`: `import '@sathwik/tokens/tokens.css'`; `globalTypes.theme` toolbar (`light`, `dark`), `initialGlobals: { theme: 'light' }`; decorator sets `document.documentElement.dataset.theme = theme` and wraps the story in `<ThemeProvider theme={theme}>`; `parameters.layout = 'padded'`. Body background must come from tokens (set in ThemeProvider root + `html { background: var(--color-bg-surface) }` in a small `preview.css` that uses only vars).
- [ ] Stories (no `play` functions, ADR 0003), `title: 'Components/<Name>'`: Button (Primary, Secondary, Ghost, Danger, Small, Loading, Disabled), Input (Default, WithHint, WithError, Disabled), Badge (AllTones), Card (Default, WithTitle), EmptyState (Default, WithAction), Stack (Vertical, InlineWrap), Dialog (Closed, Open via `defaultOpen`), Tabs (Default, SecondSelected), ThemeProvider is not a story.
- [ ] `pnpm build` (root) succeeds; `node -e "const e=Object.values(require('./apps/storybook/storybook-static/index.json').entries).filter(x=>x.type==='story');console.log(e.length)"` prints the story count (expect about 24). Record it in the ledger.
- [ ] Commit `feat(storybook): Storybook 10 with theme toolbar and stories for every component state`.

### Task 12: Prove the theme reaches the story iframe

- [ ] `pnpm --filter @ds/storybook build`, serve with `pnpm dlx sirv-cli@3.0.1 apps/storybook/storybook-static --port 5444` (background), open `http://localhost:5444/iframe.html?id=components-button--primary&viewMode=story&globals=theme:dark` in a short Playwright script or the e2e package once it exists, and confirm `html[data-theme=dark]`. If the URL `globals` parameter does not set the theme in 10.6.1, switch to the documented alternative and record a Ruling. Stop the server.
- [ ] No commit unless files changed (`fix(storybook): ...` if they did).

### Task 13: Axe over every story in both themes (invariant 4)

**Files:** `tests/visual/package.json` (`@ds/visual-tests`, private; devDeps `@playwright/test 1.63.0`, `@axe-core/playwright 4.13.0`, `sirv-cli 3.0.1`, `typescript 6.0.3`, `@types/node 26.6.4`; scripts `test:a11y: playwright test a11y.spec.ts`, `test:visual: playwright test visual.spec.ts`, `typecheck: tsc --noEmit -p tsconfig.json`), `tsconfig.json`, `playwright.config.ts`, `stories.ts`, `a11y.spec.ts`.

- [ ] `stories.ts`: reads `../../apps/storybook/storybook-static/index.json` with `fs` at module load, throws a clear error if missing ("run pnpm build first"), returns `{ id, title, name }[]` for `type === 'story'`, sorted by id. Export `THEMES = ['light', 'dark']`, `VIEWPORTS = [{ name: 'mobile', width: 375, height: 800 }, { name: 'desktop', width: 1280, height: 800 }]`, and `openStory(page, id, theme)` which navigates to `/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, waits for `#storybook-root` content, awaits `document.fonts.ready`, and asserts `html` has `data-theme` = theme.
- [ ] `playwright.config.ts`: `testDir: '.'`, `snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}'`, `fullyParallel: true`, `workers: process.env.CI ? 2 : 4`, `use: { baseURL: 'http://localhost:5444' }`, chromium only, `expect.toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled', caret: 'hide' }`, reporter `[['list'], ['json', { outputFile: 'results/' + (process.argv.some((a) => a.includes('visual')) ? 'visual' : 'a11y') + '.json' }]]`, `webServer: { command: 'pnpm exec sirv ../../apps/storybook/storybook-static --port 5444 --host 127.0.0.1', url: 'http://localhost:5444/index.json', reuseExistingServer: !process.env.CI }`.
- [ ] `a11y.spec.ts`: for each story x theme, `test(`${id} ${theme}`)`: `openStory`, `new AxeBuilder({ page }).include('#storybook-root').analyze()` (for the Dialog Open story also include the portal: use `.include('body')` for all stories to keep it simple and exclude Storybook chrome if any), filter `impact` in `['serious', 'critical']`, `expect(serious, JSON.stringify(serious.map(v => v.id))).toEqual([])`.
- [ ] Run `pnpm test:a11y`. Fix real violations in components or tokens (never by disabling rules; if a rule must be disabled, add a Ruling with the rule id and reason). Expected end state: `<2 x stories> passed`.
- [ ] Prove it can fail: temporarily add a story that renders a bare `<input />` with no label, run `pnpm build` and `pnpm test:a11y`, see a `label` violation fail that story, then delete the story and re-run to green. Note it in the ledger.
- [ ] Commit `test(a11y): axe over every story in light and dark`.

### Task 14: Visual regression in the pinned Docker image (invariant 5)

**Files:** `tests/visual/visual.spec.ts`, `docker/visual.Dockerfile`, `scripts/visual.ps1`, `scripts/visual.sh`, `tests/visual/__screenshots__/**` (generated in Docker).

- [ ] `visual.spec.ts`: `test.skip(!process.env.DS_VISUAL, 'visual baselines run only in the pinned Docker image (ADR 0004)')`; for each story x theme x viewport, one test: `page.setViewportSize`, `openStory`, `await expect(page).toHaveScreenshot([id, `${theme}-${viewport.name}.png`])`.
- [ ] `docker/visual.Dockerfile`:
```dockerfile
FROM mcr.microsoft.com/playwright:v1.63.0-noble
ENV DS_VISUAL=1 CI=1
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /work
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm --filter @sathwik/tokens build \
 && pnpm --filter @sathwik/ui build \
 && pnpm --filter @ds/storybook build
WORKDIR /work/tests/visual
ENTRYPOINT ["pnpm", "exec", "playwright", "test", "visual.spec.ts"]
```
- [ ] `scripts/visual.ps1` (param `[switch]$Update`): `docker build -f docker/visual.Dockerfile -t design-system-visual <root>`; create `tests/visual/__screenshots__` and `tests/visual/results`; `docker run --rm --name design-system-visual --ipc=host -v "<root>/tests/visual/__screenshots__:/work/tests/visual/__screenshots__" -v "<root>/tests/visual/results:/work/tests/visual/results" design-system-visual` plus `--update-snapshots` when `-Update`; exit with docker's exit code. `scripts/visual.sh` does the same for Git Bash (use `"$(pwd -W 2>/dev/null || pwd)"` for the mount path). Make the json reporter write to `results/visual.json` (the argv check in the config handles it).
- [ ] Run `powershell -NoProfile -File scripts/visual.ps1 -Update` -> baselines written (`<4 x stories>` PNGs). Run again without `-Update` -> all pass. Prove failure: change Button's padding token use (e.g. `--space-3` -> `--space-4`) and re-run -> Button stories fail with a diff; revert; re-run -> pass. Record counts in the ledger.
- [ ] On host, `pnpm test:visual` must report all tests skipped (never writes baselines).
- [ ] Commit `test(visual): Playwright screenshot baselines per story, theme and viewport in Docker` (include the PNG baselines).

### Task 15: Federation contract and `loadRemoteSafely` (invariant 7, runtime half)

**Files:** `packages/federation-contract/package.json` (`@ds/federation-contract`, private, `"type": "module"`, exports `{ ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } }`, scripts `build: tsc -p tsconfig.build.json`, `test: vitest run`, `typecheck: tsc -p tsconfig.json --noEmit`; peerDep `react ^19.0.0`; devDeps vitest, typescript, @types/react), `src/index.ts`, `src/load.ts`, `test/load.test.ts`.

- [ ] `src/index.ts`:
```ts
export const CONTRACT_VERSION = 1;
export const REMOTES = {
  billing: { exposes: ['./BillingPage', './InvoiceWidget', './contract'] },
  catalog: { exposes: ['./CatalogPage', './ProductPicker', './contract'] },
} as const;
export type RemoteName = keyof typeof REMOTES;
export const SHARED = {
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  '@sathwik/ui': { singleton: true, requiredVersion: '^0.1.0' },
} as const;
export interface BillingRemote { BillingPage: ComponentType<{ accountId: string }>; InvoiceWidget: ComponentType<{ invoiceId: string; compact?: boolean }>; }
export interface CatalogRemote { CatalogPage: ComponentType<Record<string, never>>; ProductPicker: ComponentType<{ onSelect(id: string): void }>; }
export * from './load.js';
```
- [ ] `src/load.ts`: `RemoteTimeoutError`, `ContractMismatchError` (`expected`, `actual`), `RemoteLoadError` (`cause`), all with `remote` and a readable `message` (e.g. `catalog: contract 2 is incompatible with host contract 1`). `loadRemoteSafely<T>({ remote, module, timeoutMs, expectedContract, load }): Promise<T>` where `load: (id: string) => Promise<unknown>`; loads `${remote}/contract` then `${remote}/${module}`, returns the module's `default` (or the module itself if it has no default); null/undefined -> `RemoteLoadError`; any thrown error -> `RemoteLoadError` wrapping it; the whole sequence races a `setTimeout(timeoutMs)` -> `RemoteTimeoutError`; the timer is cleared in `finally`.
- [ ] Tests first (Vitest fake timers): happy path returns the default export and calls load in order contract -> module; contract 2 -> `ContractMismatchError`, and the module load is never called; loader rejects -> `RemoteLoadError` with `cause`; loader never resolves -> rejects with `RemoteTimeoutError` after `vi.advanceTimersByTime(timeoutMs)` and not before; success clears the timer (`vi.getTimerCount() === 0`).
- [ ] Build emits `dist/index.js` + `.d.ts`. Commit `feat(contract): federation contract, shared singletons and safe remote loading`.

### Task 16: `remote-billing` (Rsbuild + Module Federation)

**Files:** `apps/remote-billing/{package.json,rsbuild.config.ts,tsconfig.json,src/index.tsx,src/bootstrap.tsx,src/BillingPage.tsx,src/InvoiceWidget.tsx,src/contract.ts,src/env.d.ts}`.

- [ ] package.json (`@ds/remote-billing`, private): deps react/react-dom 19.3.0, `@sathwik/ui workspace:*`, `@sathwik/tokens workspace:*`, `@ds/federation-contract workspace:*`; devDeps `@rsbuild/core 2.2.11`, `@rsbuild/plugin-react 2.1.1`, `@module-federation/rsbuild-plugin 2.9.2`, `@module-federation/enhanced 2.9.2`, typescript, @types/react(-dom). Scripts: `dev: rsbuild dev`, `build: rsbuild build`, `preview: rsbuild preview`, `typecheck: tsc --noEmit -p tsconfig.json`.
- [ ] `rsbuild.config.ts` (prototype-proven shape):
```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { SHARED } from '@ds/federation-contract';
const PORT = 5441;
export default defineConfig({
  server: { port: PORT, strictPort: true, cors: true },
  output: { assetPrefix: process.env.DS_BILLING_PUBLIC_URL ?? `http://localhost:${PORT}/` },
  source: { define: { DS_FORCE_CONTRACT: 'undefined' } },
  plugins: [pluginReact(), pluginModuleFederation({
    name: 'billing', filename: 'remoteEntry.js', manifest: true, dts: false,
    exposes: { './BillingPage': './src/BillingPage.tsx', './InvoiceWidget': './src/InvoiceWidget.tsx', './contract': './src/contract.ts' },
    shared: { ...SHARED },
  })],
});
```
  If `strictPort` or `cors` is not a valid Rsbuild 2 `server` key, use the documented equivalent and add a Ruling.
- [ ] `src/contract.ts`: `import { CONTRACT_VERSION as HOST } from '@ds/federation-contract'; declare const DS_FORCE_CONTRACT: number | undefined; export const CONTRACT_VERSION: number = DS_FORCE_CONTRACT ?? HOST;`
- [ ] `src/index.tsx`: `import('./bootstrap');` (async boundary). `bootstrap.tsx` (standalone only): imports `@sathwik/tokens/tokens.css` and `@sathwik/ui/styles.css`, renders `<ThemeProvider theme="light"><BillingPage accountId="acc_demo" /></ThemeProvider>`. Exposed modules must not import global CSS.
- [ ] `BillingPage` (default export): `Card` with heading "Billing", a `Tabs` (Invoices / Payment methods), an invoice table built from a static array of 4 invoices, a "Pay now" `Button` that opens a `Dialog` confirming, and `<span hidden data-ui-instance={UI_INSTANCE_ID} data-owner="billing" />`; root `data-testid="billing-page"`. `InvoiceWidget` (default export): compact card with a `useState` toggle ("Show details" / "Hide details"), `data-testid="invoice-widget"`, and the same hidden instance span.
- [ ] `pnpm --filter @ds/remote-billing build` -> `dist/mf-manifest.json` and `dist/remoteEntry.js`. Commit `feat(billing): billing remote exposing BillingPage, InvoiceWidget and contract`.

### Task 17: `remote-catalog` and its incompatible variant

- [ ] Same shape as billing: port 5442, `DS_CATALOG_PUBLIC_URL`, name `catalog`, exposes `./CatalogPage`, `./ProductPicker`, `./contract`. `CatalogPage`: grid of 6 product `Card`s with `Badge` stock tones and an `Input` filter (useState) that narrows the list; `data-testid="catalog-page"`. `ProductPicker`: list of buttons; clicking one calls `onSelect(id)` and shows "Selected: <name>" from local state; `data-testid="product-picker"`. Hidden instance span with `data-owner="catalog"` in both.
- [ ] `rsbuild.incompatible.config.ts`: imports the default config object and returns a copy with `server.port 5443`, `output.distPath.root 'dist-incompatible'`, `output.assetPrefix 'http://localhost:5443/'`, `source.define.DS_FORCE_CONTRACT '2'`. Use `mergeRsbuildConfig` from `@rsbuild/core`.
- [ ] Scripts: `build: rsbuild build && rsbuild build -c rsbuild.incompatible.config.ts`, `preview: rsbuild preview`, `preview:incompatible: rsbuild preview -c rsbuild.incompatible.config.ts`.
- [ ] Build -> `dist/` and `dist-incompatible/` both have `mf-manifest.json`. The e2e in Task 21 proves the contract-2 build is refused. Commit `feat(catalog): catalog remote plus a contract-2 build for e2e`.

### Task 18: Shell host

**Files:** `apps/shell/**` (deps as billing + `@module-federation/enhanced 2.9.2` as a dependency; devDeps add vitest, jsdom, @testing-library/react, @testing-library/dom, @testing-library/jest-dom).

- [ ] `rsbuild.config.ts`: port 5440, `strictPort`, `historyApiFallback: true`, `pluginModuleFederation({ name: 'shell', remotes: {}, shared: { ...SHARED }, dts: false })`. Scripts like billing plus `test: vitest run`; add `@vitejs/plugin-react 6.1.1` as a devDep and a `vitest.config.ts` with `plugins: [react()]`, `test.environment: 'jsdom'`, `test.include: ['src/**/*.test.{ts,tsx}']`, and a jest-dom setup file.
- [ ] `public/remotes.json`: `{ "billing": { "entry": "http://localhost:5441/mf-manifest.json", "contract": 1, "timeoutMs": 5000 }, "catalog": { "entry": "http://localhost:5442/mf-manifest.json", "contract": 1, "timeoutMs": 5000 } }`.
- [ ] `src/registry.ts`: `parseRegistry(json: unknown): Record<RemoteName, RemoteEntry>`; throws on a missing remote, a non-http entry, non-positive `timeoutMs`, or non-integer `contract`. Unit tests first.
- [ ] `src/router.ts`: `usePath()` (subscribes to `popstate`), `navigate(path)` (`history.pushState` + dispatch `popstate`); links are `<a href>` with an onClick that calls `navigate` (keeps them real links for a11y).
- [ ] `src/bootstrap.tsx`: imports `@sathwik/tokens/tokens.css`, `@sathwik/ui/styles.css`, `./global.css` (box-sizing and margin reset, token vars only); `fetch('/remotes.json')` -> `parseRegistry` -> `registerRemotes(Object.entries(reg).map(([name, r]) => ({ name, entry: r.entry })))` from `@module-federation/enhanced/runtime` -> render `<App registry={reg} />`.
- [ ] `src/RemoteRoute.tsx`: props `remote`, `module`, `entry: RemoteEntry`, `props`, `fallbackTitle`, `load` (defaults to MF `loadRemote`). Uses `React.lazy` keyed by an attempt counter; calls `performance.mark(`mf:${remote}:start`)` before `loadRemoteSafely({ ..., expectedContract: CONTRACT_VERSION })`; an error boundary renders `<EmptyState title={fallbackTitle} description={reason} action={<Button onClick={retry}>Retry</Button>} />` with `data-testid={`${remote}-fallback`}`, calls `performance.mark(`mf:${remote}:fallback`)` once when shown, and logs `console.error('[mf]', { remote, entry: entry.entry, reason })`. `Suspense` fallback is a short "Loading <remote>..." text.
- [ ] `src/App.tsx`: `ThemeProvider` with a theme toggle `Button` (aria-pressed), header nav (Dashboard `/`, Billing `/billing`, Catalog `/catalog`), routes: `/` renders `InvoiceWidget` and `ProductPicker` via `RemoteRoute` side by side plus the shell's own hidden instance span (`data-owner="shell"`); `/billing` -> `BillingPage`; `/catalog` -> `CatalogPage`; unknown -> EmptyState "Not found". `src/DebugPanel.tsx` shows when `?mf-debug=1`: remotes table (name, entry, status, contract) and shared table read from `globalThis.__FEDERATION__.__INSTANCES__[0].shareScopeMap.default` (package -> versions, and which are `loaded`), plus `UI_INSTANCE_ID`; `data-testid="mf-debug"`; each shared row has `data-testid="shared-<pkg>"` and `data-loaded-count`.
- [ ] Unit tests (`src/RemoteRoute.test.tsx`, jsdom, fake `load`): renders the module on success; renders the fallback with the reason on `ContractMismatchError`; Retry calls `load` again and then renders the module.
- [ ] `pnpm build`; manual smoke: `pnpm --filter @ds/remote-billing preview`, `... remote-catalog preview`, `... shell preview` in the background, then `curl -s http://localhost:5440/remotes.json` and `curl -s http://localhost:5441/mf-manifest.json | head -c 200`; stop them. Commit `feat(shell): host with runtime registry, safe remote routes and debug panel`.

### Task 19: Build-time contract tests (invariant 7, build half)

**Files:** `tests/contract/{package.json,vitest.config.ts,contract.test.ts,check.ts,fixtures/bad-manifest.json}`.

- [ ] `check.ts`: `checkManifest(manifest, remote: RemoteName, hostVersions: Record<string, string>): string[]` returns problems: exposes (from `manifest.exposes[].path`) not equal as a set to `REMOTES[remote].exposes`; a shared package from `SHARED` missing or `singleton !== true`; `requiredVersion` not satisfied by the host's installed version (`semver.satisfies`); `manifest.name !== remote`. Host versions come from `require.resolve`-ing `react/package.json`, `react-dom/package.json` and `@sathwik/ui/package.json` from `apps/shell` (use `createRequire(<abs path to apps/shell/package.json>)`).
- [ ] `contract.test.ts`: for billing and catalog, the built `apps/remote-*/dist/mf-manifest.json` has zero problems (fail with a message to run `pnpm build` if missing); the fixture (a copy of a real manifest with `./InvoiceWidget` removed and `react.singleton=false`) yields exactly those two problems; a host version map with `react: '18.3.1'` yields a requiredVersion problem.
- [ ] deps: `@ds/federation-contract workspace:*`, `semver 7.8.5`, `@types/semver 7.8.0`, vitest. Run `pnpm test:contract` -> pass. Commit `test(contract): check built manifests against the federation contract`.

### Task 20: E2E harness, composition and singletons (invariant 6)

**Files:** `tests/e2e/{package.json,playwright.config.ts,shell.spec.ts,singletons.spec.ts,tsconfig.json}`.

- [ ] package `@ds/e2e-tests` (devDeps `@playwright/test 1.63.0`, typescript, @types/node; script `test: playwright test`). Config: chromium only, `use.baseURL 'http://localhost:5440'`, `retries: process.env.CI ? 1 : 0`, reporter list, `webServer` array (each `reuseExistingServer: !process.env.CI`, `timeout: 60000`): `pnpm --filter @ds/shell preview` (url `http://localhost:5440/remotes.json`), billing preview (`http://localhost:5441/mf-manifest.json`), catalog preview (`http://localhost:5442/mf-manifest.json`), catalog `preview:incompatible` (`http://localhost:5443/mf-manifest.json`). Ensure `tests/e2e/results/` exists before writing JSON (`fs.mkdirSync(..., { recursive: true })`).
- [ ] `shell.spec.ts`: `/billing` shows `billing-page` with heading "Billing"; `/catalog` shows `catalog-page`; filtering in catalog narrows cards; theme toggle sets the ThemeProvider root `data-theme="dark"`.
- [ ] `singletons.spec.ts`: collect console errors and page errors; open `/?mf-debug=1`; wait for `invoice-widget` and `product-picker`; click "Show details" in InvoiceWidget and assert "Hide details" (a hook in a remote updates); pick a product and assert "Selected:"; read all `[data-ui-instance]` attributes -> `new Set(values).size === 1` and owners include `shell`, `billing`, `catalog`; `shared-react` and `shared-@sathwik/ui` rows report `data-loaded-count="1"`; no error text matches `/Invalid hook call|more than one copy of React/i`. Write `results/singletons.json` `{ uiInstanceIds: <set size>, owners: [...], reactLoadedVersions: n, uiLoadedVersions: n }`.
- [ ] `pnpm build` then `pnpm test:e2e` -> pass. Commit `test(e2e): composition and singleton checks across shell and remotes`.

### Task 21: Failure isolation and incompatible remotes (invariants 7, 8)

**Files:** `tests/e2e/remote-failure.spec.ts`, `tests/e2e/incompatible-remote.spec.ts`.

- [ ] Dead remote: `page.route('http://localhost:5442/**', (r) => r.abort())`; goto `/catalog`; `catalog-fallback` visible with "Catalog is unavailable"; then click nav "Billing" -> `billing-page` works (Pay now opens the dialog). Read `performance.measure('m', 'mf:catalog:start', 'mf:catalog:fallback').duration` -> `deadFallbackMs`. Then `page.unroute`, click Retry -> `catalog-page` renders.
- [ ] Slow remote: route `**/remotes.json` to fulfil the real JSON with `catalog.timeoutMs = 1500`; route `http://localhost:5442/mf-manifest.json` to wait 4000 ms then continue; goto `/catalog`; fallback visible; `slowFallbackMs` from the same measure; `expect(slowFallbackMs).toBeLessThanOrEqual(1500 + 500)` and `>= 1500 - 50`. Billing on `/` (InvoiceWidget) still renders.
- [ ] Write `results/remote-failure.json` `{ timeoutMs: 1500, deadFallbackMs, slowFallbackMs }` (rounded to 1 dp). Use `test.describe.configure({ mode: 'serial' })` in this file so one test writes the merged file, or write one file per test (`remote-dead.json`, `remote-slow.json`) and let the report merge.
- [ ] Incompatible: route `**/remotes.json` to point catalog at `http://localhost:5443/mf-manifest.json`; goto `/catalog`; `catalog-fallback` visible and its text contains `incompatible`; `catalog-page` count stays 0 for 1 s after the fallback (`expect(page.getByTestId('catalog-page')).toHaveCount(0)`); a console error includes `contract 2`. Billing still renders.
- [ ] `pnpm test:e2e` -> all pass. Commit `test(e2e): dead, slow and incompatible remotes fail safe`.

### Task 22: Installable packages smoke (`pnpm pack:smoke`)

**Files:** `scripts/pack-smoke.mjs`.

- [ ] Plain Node ESM, no deps: make a temp dir (`fs.mkdtempSync(os.tmpdir() + '/ds-pack-')`); run `pnpm --filter @sathwik/tokens pack --pack-destination <tmp>` and the same for `@sathwik/ui` (`execFileSync('pnpm', [...], { shell: true })` on Windows); list each tarball with `tar -tzf` and require: tokens `package/dist/tokens.css`, `tokens.js`, `tokens.d.ts`, `tokens.json`; ui `package/dist/index.js`, `package/dist/index.css`, `package/dist/types/index.d.ts`. Extract both (`tar -xzf <tgz> -C <dir>`), read each `package/package.json` and fail if any value contains `workspace:`; `import(pathToFileURL(<tokens>/package/dist/tokens.js))` and require `ColorBgSurface` to match `/^#[0-9a-f]{6}$/i`. Print `pack:smoke ok (<tokens tgz> <bytes>, <ui tgz> <bytes>)`. Clean the temp dir.
- [ ] Run `pnpm build` then `pnpm pack:smoke` -> ok. Commit `feat(release): pack smoke test for the publishable packages`.

### Task 23: Docker demo, screenshots for the README, CI workflows

**Files:** `docker/demo.Dockerfile`, `docker/nginx.conf`, `docker-compose.yml`, `tests/e2e/media.spec.ts`, `docs/media/*.png`, `.github/workflows/ci.yml`, `.github/workflows/pages.yml`.

- [ ] `demo.Dockerfile`: stage `node:24-alpine` (`corepack enable && corepack prepare pnpm@9.12.0 --activate`, `COPY . .`, `pnpm install --frozen-lockfile`, `pnpm build`), stage `nginx:1.29-alpine` copying `apps/shell/dist` -> `/srv/shell`, billing -> `/srv/billing`, catalog -> `/srv/catalog`, storybook-static -> `/srv/storybook`. If the alpine stage fails on a native binding (rspack/rolldown), switch the build stage to `node:24-bookworm-slim` and add a Ruling. `nginx.conf`: four `server` blocks listening on 5440 (shell, `try_files $uri /index.html`), 5441, 5442 (both with `add_header Access-Control-Allow-Origin * always`), 5444 (storybook); `location ~ (remoteEntry\.js|mf-manifest\.json|remotes\.json)$ { add_header Cache-Control "no-cache" always; ... }` and `location /static/ { add_header Cache-Control "public, max-age=31536000, immutable"; }`.
- [ ] `docker-compose.yml`: `name: design-system`; service `demo` with `container_name: design-system-demo`, `build: { context: ., dockerfile: docker/demo.Dockerfile }`, ports `5440:5440`, `5441:5441`, `5442:5442`, `5444:5444`.
- [ ] Verify: `docker compose up -d --build`; `curl -s -o /dev/null -w "%{http_code}" http://localhost:5440/` -> 200, `http://localhost:5441/mf-manifest.json` -> 200 with `access-control-allow-origin: *` (`curl -sI`), `http://localhost:5444/index.json` -> 200. Run `pnpm --filter @ds/e2e-tests exec playwright test shell.spec.ts` against it (servers reused, since the ports answer) -> pass. `docker compose down`.
- [ ] `media.spec.ts` (`test.skip(!process.env.DS_MEDIA)`; run with PowerShell `$env:DS_MEDIA='1'; pnpm --filter @ds/e2e-tests exec playwright test media.spec.ts; Remove-Item Env:DS_MEDIA`): writes `docs/media/shell-dashboard-light.png`, `shell-dashboard-dark.png` (1280x800), `shell-catalog-down.png` (catalog aborted, fallback visible), `shell-debug-panel.png`.
- [ ] `ci.yml` (`on: [push, pull_request]`, `permissions: contents: read`): job `verify` on `ubuntu-24.04`: `actions/checkout@v7`, `pnpm/action-setup@v6`, `actions/setup-node@v7` (node 24, cache pnpm), `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:contract`, `pnpm --filter @ds/e2e-tests exec playwright install --with-deps chromium`, `pnpm test:a11y`, `pnpm test:e2e`, `pnpm pack:smoke`, `actions/upload-artifact@v7` (always) with `tests/*/results` and `**/test-results`. Job `visual`: `container: { image: mcr.microsoft.com/playwright:v1.63.0-noble, options: --ipc=host }`, env `DS_VISUAL: '1'`, steps checkout, `corepack enable && corepack prepare pnpm@9.12.0 --activate`, install, build tokens/ui/storybook, `pnpm test:visual`, upload `tests/visual/test-results` on failure. `pages.yml`: on push to `main` + `workflow_dispatch`, builds Storybook and deploys with `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5` (`apps/storybook/storybook-static`), `actions/deploy-pages@v5`, permissions `pages: write`, `id-token: write`.
- [ ] `docker run --rm -v "${PWD}:/repo" -w /repo rhysd/actionlint:1.7.7 -color` -> no output. Commit `feat(demo): nginx demo stack, README screenshots and CI workflows`.

### Task 24: Gates and the measured headline (`pnpm report`)

**Files:** `scripts/report.mjs`, `scripts/report.test.mjs`, `bench/results/latest.json`.

- [ ] `scripts/report.mjs` exports `summarize(inputs)` (pure) and, when run directly, reads: `apps/storybook/storybook-static/index.json`; `tests/visual/results/a11y.json` and `tests/visual/results/visual.json` (Playwright JSON: count `expected`/`unexpected`/`skipped` from `stats`); `packages/tokens/dist/contrast-report.json`; `tests/e2e/results/singletons.json` and the remote-failure result(s); gzip sizes (`zlib.gzipSync`) of `packages/ui/dist/index.js`, `packages/ui/dist/index.css`, `packages/tokens/dist/tokens.css`; `git rev-parse --short HEAD`; `process.version`. Any missing file -> throw `missing input: <path> (run <command>)`. Output `bench/results/latest.json`: `{ generatedAt, commit, node, components, stories, a11y: { checks, failures }, visual: { screenshots, failures, skipped }, coverage: { visualPct, a11yPct }, contrast: { pairs, passed }, singletons, remoteFailure, sizes, headline }`. `components` = distinct story titles under `Components/`. `visualPct = screenshots passed / (stories x 4) x 100`, `a11yPct = checks passed / (stories x 2) x 100`. Headline: `` `${components} components, ${visualPct}% of ${stories} stories under visual + a11y regression (${screenshots} screenshots, ${a11yFailures} serious/critical axe violations), two independently deployed remotes sharing one React and one design system` ``.
- [ ] `scripts/report.test.mjs` (`node:test`): `summarize` on a small fake input gives the right percentages and headline; a visual run with all tests skipped (host run) yields `visualPct 0`, not 100 (guard against reporting a skipped suite).
- [ ] Run every gate in the Gates section in order. Each must exit 0. Then `pnpm report`. Paste the headline into the ledger line. Commit `chore(bench): measured headline from real test output` (with `bench/results/latest.json`).

### Task 25: README, DEVDOCS, handoff

- [ ] `README.md`: first line = the `headline` string from `bench/results/latest.json` verbatim; then the dashboard screenshots (`docs/media/*.png`); a 5-minute quickstart (`pnpm install`, `pnpm build`, `pnpm dev:mf` -> http://localhost:5440, `pnpm storybook` -> http://localhost:5444, or `docker compose up -d --build`); install section (`pnpm pack` tarballs; npm publish not yet, ADR 0010); the mermaid architecture diagram from the design; the invariants table with test paths; commands; ADR links; limits. Every number links to or quotes `bench/results/latest.json`.
- [ ] `docs/DEVDOCS.md` in the order the session brief requires (what it is + headline; 5-minute quickstart; architecture with one mermaid diagram; layout table; run/test/benchmark commands; decisions and what they gave up with ADR links; known limits and what's left), plain short sentences.
- [ ] Append to `docs/handoff.md`: `2026-10-04 · Claude (sonnet-builder) · main` with what changed, what's left (ADR 0010 list), how to verify (the Gates block).
- [ ] Re-run `pnpm lint` and `pnpm test` (docs only, but confirm). Commit `docs: README with measured headline, DEVDOCS and handoff`.
- [ ] Ledger: `FINAL: <one line per gate with its result>`.
