# Build from the repository root: docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# npm ci builds the translations in lang/ (see scripts/lang.mjs).
COPY scripts scripts
COPY lang lang
RUN npm ci --workspace @openseat/api --workspace @openseat/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @openseat/shared && npm run build -w @openseat/api \
 && npm prune --omit=dev --workspace @openseat/api --workspace @openseat/shared

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/package.json apps/api/
COPY --from=build /app/apps/api/dist apps/api/dist
USER node
EXPOSE 8787
CMD ["node", "apps/api/dist/index.js"]
