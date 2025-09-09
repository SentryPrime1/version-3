# syntax=docker/dockerfile:1.7
FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Production dependencies stage
FROM base AS prod_deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/common/package.json packages/common/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install -r --prod
# Explicitly install reflect-metadata for production with workspace flag
RUN pnpm add -w reflect-metadata
RUN pnpm -w approve-builds @nestjs/core esbuild @tailwindcss/oxide
RUN pnpm fetch

# Development dependencies stage  
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/common/package.json packages/common/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install -r

# Build stage
FROM base AS build
COPY . .
COPY --from=deps /app/node_modules /app/node_modules
RUN pnpm -r --filter @common build && pnpm -r --filter backend build

# Runtime stage
FROM node:22-slim AS runner
WORKDIR /app
RUN useradd -m appuser
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=prod_deps /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]
