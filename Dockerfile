FROM node:20

WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies with no frozen lockfile (fixes our issue!)
RUN pnpm install --no-frozen-lockfile

# Build common package first, then backend
RUN pnpm build:common && cd apps/backend && pnpm build

# Change to backend directory for runtime
WORKDIR /app/apps/backend

# Start the application
CMD ["node", "dist/main.js"]
