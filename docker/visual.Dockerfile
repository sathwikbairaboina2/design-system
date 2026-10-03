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
