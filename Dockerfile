# syntax=docker/dockerfile:1.7
FROM node:22-slim AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/common/package.json ./packages/common/

# Install all dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm -r --filter @common build
RUN pnpm -r --filter backend build

# Production stage
FROM node:22-slim AS runner

# Create app user for security
RUN useradd -m appuser

WORKDIR /app

# Copy built application
COPY --from=base /app/apps/backend/dist ./dist

# Copy node_modules (only the ones that exist)
COPY --from=base /app/node_modules ./node_modules

# Copy package.json for runtime reference
COPY --from=base /app/apps/backend/package.json ./package.json

# Set ownership
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
