# ADR 0009: Host ports 5440-5449, `design-system-` names, and an nginx demo container

Date: 2026-10-04 · Status: accepted

## Context
Nineteen sibling projects run on the same machine. This repo may use host ports 5440-5449 only.

## Decision
5440 shell, 5441 billing, 5442 catalog, 5443 incompatible catalog (e2e only), 5444 Storybook. Dev servers, previews,
Playwright `webServer` entries and the compose demo all use these. The demo (`docker/demo.Dockerfile`) builds every
app in `node:24-alpine` and serves the static output from `nginx:1.29-alpine` on 5440, 5441, 5442 and 5444, with CORS
on the remotes, `no-cache` on `remoteEntry.js` and `mf-manifest.json`, and long caching on hashed assets. The compose
project is `design-system` and the container is `design-system-demo`. Remote public URLs default to
`http://localhost:544x/`.

## What I gave up
- **Default framework ports** (3000, 6006). Docs and scripts must say 5440-5444.
- **A real CDN layout.** One nginx with four ports stands in for four origins.
