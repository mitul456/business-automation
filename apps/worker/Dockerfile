# ==============================================================================
# OmniFlow Worker Engine — Production Multi-Stage Dockerfile
# ==============================================================================

# STAGE 1: Base & Dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@12.16.1 --activate

# STAGE 2: Monorepo Builder
FROM base AS builder
WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/integrations/package.json ./packages/integrations/
COPY apps/worker/package.json ./apps/worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy sources
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY packages/integrations ./packages/integrations
COPY apps/worker ./apps/worker

# Generate Prisma Client & Build Packages
RUN pnpm --filter @omniflow/database prisma generate
RUN pnpm --filter @omniflow/shared build
RUN pnpm --filter @omniflow/integrations build
RUN pnpm --filter @omniflow/worker build

# STAGE 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 worker

# Copy built application & node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json

USER worker

CMD ["node", "apps/worker/dist/index.js"]
