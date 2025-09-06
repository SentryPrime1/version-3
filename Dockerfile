# syntax=docker/dockerfile:1.7

########## BASE ##########
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

########## DEPS (install for the whole workspace) ##########
FROM base AS deps
# Copy manifests first for caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
# Prefetch & approve scripts required by pnpm v10
RUN pnpm fetch
RUN pnpm -w approve-builds @nestjs/core esbuild @tailwindcss/oxide
# Install all deps recursively (incl dev) so build can run
RUN pnpm install -r

########## BUILD ##########
FROM base AS build
COPY . .
# Reuse resolved node_modules from deps
COPY --from=deps /app/node_modules /app/node_modules
# Build shared + backend
RUN pnpm -r --filter @common build && pnpm -r --filter backend build

########## RUNNER ##########
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
# Optional: drop privileges
RUN useradd -m appuser
USER appuser

# Copy compiled backend and the resolved node_modules
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main.js"]
