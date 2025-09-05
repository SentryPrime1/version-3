# syntax=docker/dockerfile:1.7

# -----
# Base
# -----
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

# -----
# Deps
# -----
FROM base as deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
RUN pnpm fetch
RUN pnpm install -r

# -----
# Build
# -----
FROM base as build
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules /app/node_modules
RUN pnpm -r --filter @common build && pnpm -r --filter backend build

# -----
# Runner
# -----
FROM base as runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/backend/dist /app/dist
COPY --from=deps /app/node_modules /app/node_modules
RUN pnpm prune --prod
EXPOSE 3000
CMD ["node", "dist/main.js"]


