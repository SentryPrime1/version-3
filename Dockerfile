# syntax=docker/dockerfile:1.7

########## BASE ##########
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

########## DEPS (install ALL workspace deps once) ##########
FROM base AS deps
# Copy manifests for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
# Optional: approve postinstall scripts pnpm v10 warns about
RUN pnpm -w approve-builds @nestjs/core esbuild @tailwindcss/oxide
# Install all deps (dev+prod) recursively so we can build everything
RUN pnpm install -r

########## BUILD ##########
FROM base AS build
COPY . .
# reuse node_modules from deps
COPY --from=deps /app/node_modules /app/node_modules
# build shared first, then backend
RUN pnpm -r --filter @common build && pnpm -r --filter backend build

########## RUNNER (use the SAME node_modules we built with) ##########
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app/apps/backend

# non-root (optional)
RUN useradd -m appuser
USER appuser

# copy compiled backend
COPY --from=build /app/apps/backend/dist ./dist
# copy the full workspace node_modules (contains reflect-metadata)
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main.js"]
