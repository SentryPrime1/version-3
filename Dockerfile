# syntax=docker/dockerfile:1.7
FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Install all dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/common/package.json packages/common/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install -r

# Copy source code and build
COPY . .
RUN pnpm -r --filter @common build && pnpm -r --filter backend build

# Production stage with explicit reflect-metadata
FROM node:22-slim AS runner
WORKDIR /app
RUN useradd -m appuser && corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy package files for production install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/common/package.json packages/common/package.json
COPY apps/backend/package.json apps/backend/package.json

# Install production dependencies with explicit reflect-metadata
RUN pnpm install -r --prod && pnpm add -w reflect-metadata

# Copy built application
COPY --from=base /app/apps/backend/dist ./dist

USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]
