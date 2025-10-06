FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker

# Build
RUN pnpm --filter @ctrlscroll/shared build
RUN pnpm --filter @ctrlscroll/worker build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=base /app/apps/worker/dist ./dist
COPY --from=base /app/apps/worker/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Create data directory
RUN mkdir -p /data

EXPOSE 3002

CMD ["node", "dist/index.js"]
