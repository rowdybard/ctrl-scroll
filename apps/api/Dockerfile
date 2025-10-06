FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build
RUN pnpm --filter @ctrlscroll/shared build
RUN pnpm --filter @ctrlscroll/api build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Create data directory
RUN mkdir -p /data

EXPOSE 3001

CMD ["node", "dist/index.js"]
