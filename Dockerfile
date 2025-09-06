# syntax=docker/dockerfile:1.7

########## BASE ##########
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

########## DEPS ##########
FROM base AS deps
WORKDIR /app
# Manifests first for caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
# Prefetch to warm cache (optional but nice)
RUN pnpm fetch
# Install ALL deps (incl dev) so we can build
RUN pnpm install -r

########## BUILD ##########
FROM base AS build
WORKDIR /app
COPY . .
# Reuse node_modules from deps
COPY --from=deps /app/node_modules /app/node_modules
# Build shared and backend
RUN pnpm -r --filter @common build && pnpm -r --filter backend build

########## RUNNER ##########
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Run as non-root for security
RUN useradd -m appuser
USER appuser

# Copy built backend only + production deps
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
# Trim dev deps from node_modules
RUN pnpm prune --prod

EXPOSE 3000
CMD ["node", "dist/main.js"]
