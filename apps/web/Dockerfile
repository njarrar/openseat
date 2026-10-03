# Build from the repository root: docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com .
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=""
ARG VITE_SAMPLE_DATA="true"
ENV VITE_API_URL=$VITE_API_URL VITE_SAMPLE_DATA=$VITE_SAMPLE_DATA
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @openseat/web --workspace @openseat/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @openseat/web

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
