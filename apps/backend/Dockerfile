FROM node:20

WORKDIR /app

# Copy workspace configuration files first
COPY ../../pnpm-workspace.yaml ./
COPY ../../package.json ./
COPY ../../pnpm-lock.yaml ./

# Copy all packages and apps
COPY ../../packages ./packages
COPY ../../apps ./apps

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies with no frozen lockfile
RUN pnpm install --no-frozen-lockfile

# Build common package first, then backend
RUN pnpm build:common && cd apps/backend && pnpm build

# Change to backend directory for runtime
WORKDIR /app/apps/backend

# Start the application
CMD ["node", "dist/main.js"]
