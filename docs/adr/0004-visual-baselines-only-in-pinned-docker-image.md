# ADR 0004: Visual baselines are made and compared only in the pinned Playwright image

Date: 2026-10-04 · Status: accepted

## Decision
`docker/visual.Dockerfile` starts `FROM mcr.microsoft.com/playwright:v1.63.0-noble` (Node 24.20), copies the repo
(never the host `node_modules`), runs `pnpm install --frozen-lockfile`, builds tokens, ui and Storybook, and runs the
Playwright visual spec. `scripts/visual.ps1` and `scripts/visual.sh` build that image as `design-system-visual` and
run it with `tests/visual/__screenshots__` and `tests/visual/results` bind-mounted. CI uses the same image as a job
container. Everything else (unit, lint, build, e2e, a11y) runs on the host with Node 24 and pnpm 9.12.0.

## What I gave up
- **Fast local loops for visual tests.** Each run rebuilds the image layer that copies the repo.
- **Updating baselines on Windows.** `visual.spec.ts` skips unless `DS_VISUAL=1`, so the host never writes a baseline.
- **Docker-only purity.** Unlike the Go siblings, Node runs on the host; only the pixel-sensitive step is containerised.
