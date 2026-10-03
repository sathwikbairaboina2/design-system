# Design system and micro-frontends: v0.1 spec

Date: 2026-10-04 · Lead: Claude Opus (plan, review) · Builder: `sonnet-builder`
Source design: `C:\Users\sathwik\projects\taskarinchu\docs\devdocs\design-system.md`
Plan: `docs/superpowers/plans/2026-10-04-design-system.md` · Decisions: `docs/adr/0001`-`0010`

## One line

DTCG design tokens compile, through a validator that fails on bad contrast, into CSS variables and typed
constants. A typed React library (`@sathwik/ui`) is built on those variables, documented in Storybook, and
guarded by visual-regression and axe tests over every story. Two independently built Module Federation remotes
(billing and catalog) render inside one host shell that shares a single React and a single `@sathwik/ui`.

## Portfolio bar (from the shortlist) and how v0.1 meets it

| Bar | v0.1 answer |
|---|---|
| 30-second wow | `docker compose up` serves the shell, both remotes and Storybook on `localhost:5440-5444`. README shows real screenshots (light, dark, remote-down fallback) captured by Playwright. A GitHub Pages workflow publishes Storybook once the repo is pushed (inert until then). |
| Headline number | README line 1 is filled from `bench/results/latest.json`, which `pnpm report` builds from real test output: component count, story count, screenshot assertions, axe violations, contrast pairs, fallback latency of a dead remote. |
| Something installable | `@sathwik/tokens` and `@sathwik/ui` are publishable ESM packages with types. `pnpm pack:smoke` packs both, checks the tarball contents and imports the tokens package from the tarball. No publish in v0.1 (ADR 0010). |
| Honest ADRs | `docs/adr/0001`-`0010`, each with a "What I gave up" section. |
| CI with tests | `.github/workflows/ci.yml`: install, tokens, lint, typecheck, unit, build, contract, a11y, e2e, and a visual job in the pinned Playwright container. Checked locally with `actionlint`. |

## Scope of v0.1

In:
- `packages/tokens`: DTCG JSON (primitives, semantic light, semantic dark overrides), `contrast-pairs.json`,
  a validator (references, cycles, `$type`, WCAG contrast per theme) and a Style Dictionary 5 build to
  `dist/tokens.css` (`:root` + `[data-theme="dark"]`), `dist/tokens.js` + `dist/tokens.d.ts` (flat ES constants)
  and `dist/tokens.json` (resolved values per theme).
- `packages/eslint-plugin`: rule `no-raw-design-values` for CSS (via `@eslint/css`): no hex colours, no colour
  functions, no px other than `0` and `1px` borders/outlines. RuleTester tests.
- `packages/ui`: `ThemeProvider`, `Stack`, `Inline`, `Button`, `Input`, `Badge`, `Card`, `EmptyState`, `Dialog`
  (Radix), `Tabs` (Radix). CSS Modules on token variables only. Forwarded refs and `className` passthrough on
  every leaf component. Built with Vite library mode to `dist/index.js`, `dist/index.css`, `dist/types/*.d.ts`.
  Exports `UI_INSTANCE_ID` (a per-module-instance random id) used to prove the singleton at runtime.
- `packages/federation-contract`: `CONTRACT_VERSION`, the expected exposes per remote, the shared singleton
  list, remote prop types, and `loadRemoteSafely()` (timeout, contract check, typed errors).
- `apps/storybook`: Storybook 10 (react-vite), theme toolbar, stories for every component state.
- `apps/remote-billing` (exposes `./BillingPage`, `./InvoiceWidget`, `./contract`) and `apps/remote-catalog`
  (exposes `./CatalogPage`, `./ProductPicker`, `./contract`), built with Rsbuild 2 + `@module-federation/rsbuild-plugin`.
  Catalog also builds an "incompatible" variant (`CONTRACT_VERSION` 2) used only by e2e.
- `apps/shell`: host with a tiny pathname router (`/`, `/billing`, `/catalog`), registry `public/remotes.json`,
  `RemoteRoute` (error boundary + `EmptyState` fallback + retry), debug panel at `?mf-debug=1`.
- Tests: Vitest unit tests (tokens, eslint rule, ui, federation-contract), build-time contract tests over the
  built `mf-manifest.json` files, Playwright e2e (both remotes render, singletons, dead remote, slow remote,
  incompatible remote), Playwright a11y (axe over every story in both themes) and Playwright visual regression
  (every story x {light, dark} x {375, 1280}) in the pinned Docker image.
- Docker: `docker/visual.Dockerfile` (Playwright image, baselines), `docker/demo.Dockerfile` + `docker-compose.yml`
  (nginx serving the built shell, remotes and Storybook).
- `scripts/report.mjs` -> `bench/results/latest.json`, README, `docs/DEVDOCS.md`, `docs/handoff.md`.

Out (v0.2+, listed in DEVDOCS "what's left"): Changesets and npm publish, api-extractor gate (invariant 10),
`size-limit` budgets, Select/Checkbox/Switch/Toast/Table, token gallery page, Figma sync, SSR, a live hosted
MF demo, Turborepo caching.

## Invariants and their proving tests (v0.1)

| # | Invariant | Test |
|---|---|---|
| 1 | Every pair in `contrast-pairs.json` meets its minimum in light and dark, or the token build throws naming the pair, theme and ratio. | `packages/tokens/test/validate.test.ts` (failing fixture, real tokens pass) |
| 2 | Every reference resolves, no cycles, every `$type` is one of `color`, `dimension`, `fontFamily`, `fontWeight`, `number`, `duration`, `shadow`. | `packages/tokens/test/resolve.test.ts` |
| 3 | `packages/ui/src/**/*.css` uses no raw colour or raw px. | `packages/eslint-plugin/test/no-raw-design-values.test.ts` + `pnpm lint` |
| 4 | Every story has zero axe violations of impact serious or critical, in both themes. | `tests/visual/a11y.spec.ts` |
| 5 | Every story x theme x viewport matches its committed baseline (`maxDiffPixelRatio` 0.001). | `tests/visual/visual.spec.ts` (Docker only) |
| 6 | One React and one `@sathwik/ui` at runtime across shell and remotes; hooks inside remotes work. | `tests/e2e/singletons.spec.ts` |
| 7 | A remote whose exposes, shared config or `CONTRACT_VERSION` don't match is never mounted. | `tests/contract/contract.test.ts` + `tests/e2e/incompatible-remote.spec.ts` + `packages/federation-contract/test/load.test.ts` |
| 8 | A dead or slow remote never breaks the shell or the other remote; fallback shows within `timeoutMs` + 500 ms. | `tests/e2e/remote-failure.spec.ts` |
| 9 | Dialog traps focus and restores it on close; Tabs follow the arrow-key pattern. | `packages/ui/src/Dialog/Dialog.test.tsx`, `packages/ui/src/Tabs/Tabs.test.tsx` |

## Pinned toolchain (all verified to exist on 2026-10-04)

Node 24 (host has v24.18.0; Playwright image has v24.20.0), pnpm 9.12.0 (host).
react / react-dom / @types/react / @types/react-dom 19.3.0 · typescript 6.0.3 · vite 8.3.2 ·
@vitejs/plugin-react 6.1.1 · vitest 5.0.3 · jsdom 30.1.1 · @testing-library/react 16.3.3 ·
@testing-library/dom 10.4.2 · @testing-library/user-event 14.6.7 · @testing-library/jest-dom 7.0.1 ·
style-dictionary 5.6.0 · @radix-ui/react-dialog 1.1.23 · @radix-ui/react-tabs 1.1.21 ·
storybook / @storybook/react-vite / @storybook/addon-a11y / @storybook/addon-docs 10.6.1 ·
@playwright/test 1.63.0 (image `mcr.microsoft.com/playwright:v1.63.0-noble`) · @axe-core/playwright 4.13.0 ·
@rsbuild/core 2.2.11 · @rsbuild/plugin-react 2.1.1 · @module-federation/rsbuild-plugin 2.9.2 ·
@module-federation/enhanced 2.9.2 · eslint 9.39.5 · @eslint/css 1.4.0 · typescript-eslint 8.71.0 ·
eslint-plugin-jsx-a11y 6.10.2 · globals 17.13.0 · semver 7.8.5 · @types/semver 7.8.0 · @types/node 26.6.4 ·
images `nginx:1.29-alpine`, `rhysd/actionlint:1.7.7`.

Why not the newest: TypeScript 7.0.2 and ESLint 10.12.0 exist, but typescript-eslint 8.71.0 needs
`typescript <6.1.0` and eslint-plugin-jsx-a11y 6.10.2 peers only up to ESLint 9 (ADR 0007).

## Prototypes run before planning (scratchpad, 2026-10-04)

1. **Style Dictionary 5.6.0** with DTCG `$value` and `{ref}` references: `css/variables` with
   `options.selector` gives `:root {...}` and `[data-theme="dark"] {...}`; the dark build uses
   `include: [base]`, `source: [dark]` and `filter: (t) => t.isSource` so only overrides are emitted.
   `javascript/es6` and `typescript/es6-declarations` give flat constants (`ColorBgSurface`). Works.
2. **@eslint/css 1.4.0 on ESLint 9.39.5**: a custom rule visiting `Declaration` and walking `value.children`
   (`Hash`, `Dimension` with `unit`/`value`, `Function` with `name`) reports raw values; `RuleTester` with
   `{ plugins: { css }, language: 'css/css' }` passes valid/invalid cases and fails on a wrong error count;
   the flat config `{ files: ['**/*.css'], language: 'css/css', plugins: { css, ds } }` works from the CLI.
3. **Module Federation (Rsbuild 2.2.11 + rsbuild-plugin 2.9.2, React 19.3.0)**: host with `remotes: {}` calls
   `registerRemotes([{ name, entry: '<origin>/mf-manifest.json' }])` and `loadRemote('billing/BillingPage')`
   from `@module-federation/enhanced/runtime`. A workspace `@sathwik/ui` shared as a singleton was evaluated
   exactly once; a `useState` component from the remote worked when clicked; no console errors.
   `globalThis.__FEDERATION__.__INSTANCES__[0].shareScopeMap.default` lists versions per shared package.
   A dead remote rejects with `Failed to get manifest. #RUNTIME-003` (about 55 ms); a missing expose rejects
   with `Module "./Nope" does not exist in container.` Both are real rejections, so a timeout + catch works.
   The manifest has `exposes[{name, path}]` and `shared[{name, version, singleton, requiredVersion}]`.
   Remote entries need `index.tsx` -> `import('./bootstrap')` (async boundary).
4. **Storybook 10.6.1 + Vite 8.3.2**: `storybook build -o storybook-static --quiet` works with CSS Modules;
   `index.json` has `entries[id].type === 'story'`.
5. **Vite 8 library mode + TS 6.0.3 + Vitest 5 + jsdom 30 + Radix Dialog**: lib build emits `dist/index.js`
   and `dist/index.css` (one CSS file with `cssCodeSplit: false`); `tsc --emitDeclarationOnly` works with
   explicit `"types": []`; a Radix Dialog focus-trap/restore test with user-event passes in jsdom.

## Ports and names

Host ports 5440-5449 only. 5440 shell, 5441 billing, 5442 catalog, 5443 catalog (incompatible, e2e only),
5444 Storybook (dev and static). Docker names start with `design-system-`. Compose project name `design-system`.
