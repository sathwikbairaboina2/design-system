# ADR 0002: Plain pnpm workspaces, no Turborepo in v0.1

Date: 2026-10-04 · Status: accepted

## Decision
pnpm 9.12.0 workspaces (`packages/*`, `apps/*`, `tests/*`). Root scripts use `pnpm -r` (topological order) and
`--filter`. The source design named Turborepo. v0.1 has about a dozen workspace packages that build in minutes,
so a task cache would add a tool and a config file for little gain.

## What I gave up
- **Cached and affected-only builds.** CI rebuilds everything on every push. "A remote change deploys only that
  remote" is shown by per-app build scripts and output folders, not by a computed task graph.
- **The Turborepo line on the resume.** Adding it later is one `turbo.json`.
