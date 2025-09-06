# syntax=docker/dockerfile:1.7

########## BASE ##########
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

########## DEPS (all deps incl. dev for building) ##########
FROM base AS deps
# Copy manifests first for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
# Pre-fetch & approve scripts for pnpm v10
RUN pnpm fetch
RUN pnpm -w approve-builds @nestjs/core esbuild @tailwindcss/oxide
# Install all deps recursively so we can build
RUN pnpm install -r

########## BUILD ##########
FROM base AS build
COPY . .
# Reuse node_modules from deps
COPY --from=deps /app/node_modules /app/node_modules
# Build shared + backend
RUN pnpm -r --filter @common build && pnpm -r --filter backend build

########## PROD-DEPS (production-only node_modules) ##########
FROM base AS prod_deps
# Copy manifests again (fresh layer)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
# Only production deps for all workspace packages (includes backend + common)
RUN pnpm fetch
RUN pnpm -w approve-builds @nestjs/core esbuild @tailwindcss/oxide
RUN pnpm install -r --prod

########## RUNNER ##########
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
# Optional: drop privileges
RUN useradd -m appuser
USER appuser

# Copy built backend
COPY --from=build /app/apps/backend/dist ./dist
# Copy production-only node_modules
COPY --from=prod_deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main.js"]
