# ==============================================================================
# OmniFlow API — Production Multi-Stage Dockerfile
# ==============================================================================

# STAGE 1: Base & Dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@12.16.1 --activate

# STAGE 2: Monorepo Builder
FROM base AS builder
WORKDIR /app

# Copy monorepo dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/integrations/package.json ./packages/integrations/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY packages/integrations ./packages/integrations
COPY apps/api ./apps/api

# Generate Prisma Client & Build Packages
RUN pnpm --filter @omniflow/database prisma generate
RUN pnpm --filter @omniflow/shared build
RUN pnpm --filter @omniflow/integrations build
RUN pnpm --filter @omniflow/api build

# STAGE 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

# Copy built application & node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

USER nestjs
EXPOSE 4000
ENV PORT=4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
