FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build shared package
RUN pnpm --filter @ctrlscroll/shared build

# Build Next.js app
RUN pnpm --filter @ctrlscroll/web build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=base /app/apps/web/.next/standalone ./
COPY --from=base /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=base /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
