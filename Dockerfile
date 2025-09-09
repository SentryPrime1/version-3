# syntax=docker/dockerfile:1.7

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
RUN pnpm install -r

FROM base AS build
COPY . .
COPY --from=deps /app/node_modules /app/node_modules
RUN pnpm -r --filter @common build && pnpm -C apps/backend build

FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
# Install production dependencies directly
COPY apps/backend/package.json ./package.json
RUN npm install --only=production
# Copy built application
COPY --from=build /app/apps/backend/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
