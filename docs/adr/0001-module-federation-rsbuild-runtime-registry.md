# ADR 0001: Module Federation on Rsbuild, with remotes registered at runtime

Date: 2026-10-04 · Status: accepted

## Context
The shell must compose a billing app and a catalog app that build and deploy on their own, while sharing one React
and one copy of `@sathwik/ui`. Options: iframes, single-spa with import maps, build-time npm composition, the
Vite federation plugin, or `@module-federation/rsbuild-plugin` (maintained by the Module Federation team).

## Decision
- Rsbuild 2.2.11 + `@module-federation/rsbuild-plugin` 2.9.2 for all three apps.
- The shell declares `remotes: {}` and reads `public/remotes.json` at startup. It calls `registerRemotes` and
  `loadRemote` from `@module-federation/enhanced/runtime`. Changing a remote URL is a JSON change, not a shell rebuild.
- `react`, `react-dom` and `@sathwik/ui` are shared with `singleton: true` and `requiredVersion` ranges.
- A prototype on 2026-10-04 proved one `@sathwik/ui` evaluation, working hooks across the boundary, and real
  promise rejections for a dead remote and a missing expose (see the spec).

## What I gave up
- **Isolation.** Unlike iframes, a remote runs in the host's JS realm. A remote that throws during render needs an
  error boundary, and a remote that pollutes globals or global CSS is not contained.
- **One bundler.** Storybook and `packages/ui` build with Vite; the apps build with Rsbuild. Two tools to keep current.
- **SSR.** Federated remotes render on the client only.
