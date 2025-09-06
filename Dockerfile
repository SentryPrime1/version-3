# syntax=docker/dockerfile:1.7

########## BASE ##########
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

########## DEPS (workspace install for build) ##########
FROM base AS deps
# Manifests first for caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
# Prepare & allow needed postinstalls
RUN pnpm fetch
RUN pnpm -w approve-builds @nestjs/core esbuild @tailwindcss/oxide
# Full recursive install so we can build everything
RUN pnpm install -r

########## BUILD ##########
FROM base AS build
COPY . .
COPY --from=deps /app/node_modules /app/node_modules
RUN pnpm -r --filter @common build && pnpm -r --filter backend build

########## BACKEND PROD DEPS (only for apps/backend) ##########
FROM base AS backend_prod_deps
# Copy the manifests required to resolve backend deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
# (common is a workspace dep, but pnpm will link it correctly for runtime)
RUN pnpm fetch
RUN pnpm -w approve-builds @nestjs/core esbuild @tailwindcss/oxide
# Install **only** backend prod deps into apps/backend/node_modules
RUN pnpm -C apps/backend install --prod

########## RUNNER ##########
FROM node:22-slim AS runner
ENV NODE_ENV=production
# Run from backend directory so Node resolves apps/backend/node_modules
WORKDIR /app/apps/backend
# Optional hardening
RUN useradd -m appuser
USER appuser

# Copy compiled backend
COPY --from=build /app/apps/backend/dist ./dist
# Copy backend's own node_modules (contains reflect-metadata, Nest, etc.)
COPY --from=backend_prod_deps /app/apps/backend/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main.js"]
