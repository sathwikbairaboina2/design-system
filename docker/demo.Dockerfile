FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /work
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

FROM nginx:1.29-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /work/apps/shell/dist /srv/shell
COPY --from=build /work/apps/remote-billing/dist /srv/billing
COPY --from=build /work/apps/remote-catalog/dist /srv/catalog
COPY --from=build /work/apps/storybook/storybook-static /srv/storybook
EXPOSE 5440 5441 5442 5444
