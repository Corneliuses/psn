# Build stage: install the pnpm workspace, build the static site and the chat
# server. The site package imports the root `psn` package and the JSON
# snapshots in data/, so the build context must be the repo root.
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@10.33.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY site/package.json site/
COPY server/package.json server/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter site build && pnpm --filter chat-server build

# Serve stage: the chat server serves the built site and the help desk API
# from one process on port 8080 (Cloud Run's default container port). The
# server bundle has no runtime dependencies, so no node_modules ship.
#
# Runtime configuration (see server/src/index.ts and the README):
#   GEMINI_API_KEY    required — set it as a secret on the service, never bake it in
#   GEMINI_MODEL      optional model override
#   CHAT_TRUST_PROXY  "1" only when the host's ingress appends the caller to
#                     X-Forwarded-For (Cloud Run does); otherwise the rate limit
#                     keys on the socket address so the header can't be forged
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 STATIC_DIR=/app/site/dist
COPY --from=build /app/site/dist ./site/dist
COPY --from=build /app/server/dist ./server/dist
USER node
EXPOSE 8080
CMD ["node", "server/dist/index.js"]
