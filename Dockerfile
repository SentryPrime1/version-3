# syntax=docker/dockerfile:1.7

########## BASE ##########
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

########## DEPS (dev + prod for build) ##########
FROM base AS deps
# Cache-friendly: copy manifests only
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
RUN pnpm fetch
# pnpm v10 requires approving some postinstall scripts in CI
RUN pnpm -w approve-builds @nestjs/core esbuild @tailwindcss/oxide
RUN pnpm install -r

########## BUILD ##########
FROM base AS build
COPY . .
COPY --from=deps /app/node_modules /app/node_modules
# Build shared then backend
RUN pnpm -r --filter @common build && pnpm -r --filter backend build

########## PROD DEPS (root node_modules with only prod deps) ##########
FROM base AS proddeps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
RUN pnpm fetch
RUN pnpm -w approve-builds @nestjs/core esbuild @tailwindcss/oxide
# ⬅️ Install production deps for the whole workspace at the ROOT
RUN pnpm install -r --prod

########## RUNNER ##########
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app/apps/backend

# (optional) non-root
RUN useradd -m appuser
USER appuser

# Copy compiled backend
COPY --from=build /app/apps/backend/dist ./dist
# Copy ROOT node_modules that contains backend + deps (incl. reflect-metadata)
COPY --from=proddeps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main.js"]
