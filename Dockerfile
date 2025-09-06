# syntax=docker/dockerfile:1.7

########## BASE ##########
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

########## DEPS (install ALL workspace deps once) ##########
FROM base AS deps
# copy only manifests for deterministic caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
RUN pnpm install -r

########## BUILD ##########
FROM base AS build
COPY . .
# reuse the fully-installed workspace from deps
COPY --from=deps /app/node_modules /app/node_modules
# build shared first, then backend
RUN pnpm -r --filter @common build && pnpm -C apps/backend build

########## RUNNER ##########
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# We keep it simple & reliable: bring the **root** node_modules
COPY --from=deps  /app/node_modules           /app/node_modules
# Copy compiled backend output to /app/dist
COPY --from=build /app/apps/backend/dist      /app/dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
