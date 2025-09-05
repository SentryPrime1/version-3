# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM node:22-slim AS builder
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# pin pnpm version so CI == local
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

WORKDIR /app

# 1) Maximize cache by copying only manifests first
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/common/package.json packages/common/package.json

# 2) Prefetch deps into a content-addressed store (great for caching)
RUN pnpm fetch

# 3) Now add sources
COPY . .

# 4) Install from the fetched store (no network), workspace-wide
RUN pnpm -w install
RUN pnpm -w --filter @common build && pnpm -w --filter backend build

# Optional: produce a minimal deployable app tree for backend
RUN pnpm -w --filter backend deploy --prod /out


# ---------- runner ----------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the minimal deploy output
COPY --from=builder /out ./

# Railway provides PORT; ensure your Nest app listens to it.
# In apps/backend/src/main.ts:
# await app.listen(process.env.PORT || 3000);

EXPOSE 3000
CMD ["node", "dist/main.js"]


ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

