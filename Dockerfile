# syntax=docker/dockerfile:1.7

########## BASE ##########
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

########## DEPS ##########
FROM base AS deps
WORKDIR /app
# Copy manifests for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json
# (Optional) prefetch + approve scripts for pnpm v10
RUN pnpm fetch
RUN pnpm -w approve-builds --all
# Install all deps (incl dev) so we can build
RUN pnpm install -r

########## BUILD ##########
FROM base AS build
WORKDIR /app
COPY . .
# reuse node_modules from deps
COPY --from=deps /app/node_modules /app/node_modules
# build shared + backend
RUN pnpm -r --filter @common build && pnpm -r --filter backend build
# produce a production-only bundle for backend into /out (code + prod node_modules)
RUN pnpm -w --filter backend deploy --prod /out

########## RUNNER ##########
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
# security (optional)
RUN useradd -m appuser
USER appuser
# copy pre-bundled production output; no pnpm needed in this layer
COPY --from=build /out ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
