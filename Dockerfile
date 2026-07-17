# Build stage: install the pnpm workspace and build the static site.
# The site package imports the root `psn` package and the JSON snapshots
# in data/, so the build context must be the repo root.
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@10.33.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY site/package.json site/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter site build

# Serve stage: nginx on port 8080 (Cloud Run's default container port).
FROM nginx:alpine
COPY site/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/site/dist /usr/share/nginx/html
