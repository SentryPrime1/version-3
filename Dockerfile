# syntax=docker/dockerfile:1.7

########## BASE ##########
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
# pnpm v10
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

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
# Bring in source and reuse node_modules from deps
COPY . .
COPY --from=deps /app/node_modules /app/node_modules
# Build shared + backend
RUN pnpm -r --filter @common build && pnpm -r --filter backend build

########## BACKEND PROD DEPS (production-only node_modules) ##########
FROM base AS backend_prod_deps
# Copy manifests again (fresh layer)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
# Only production deps needed at runtime
RUN pnpm fetch
RUN pnpm -w approve-builds @nestjs/core esbuild @tailwindcss/oxide
RUN pnpm -C apps/backend install --prod

########## RUNNER ##########
FROM node:22-slim AS runner
ENV NODE_ENV=production
# Run the app from the backend directory
WORKDIR /app/apps/backend

# Optional: non-root user
RUN useradd -m appuser
USER appuser

# Copy compiled backend and production deps
COPY --from=build /app/apps/backend/dist ./dist
# 🔧 IMPORTANT: pnpm places workspace node_modules at repo root
COPY --from=backend_prod_deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main.js"]
