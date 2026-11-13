# ==============================================================================
# OmniFlow Web Client — Production Standalone Multi-Stage Dockerfile
# ==============================================================================

# STAGE 1: Base & Dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@12.16.1 --activate

# STAGE 2: Monorepo Builder
FROM base AS builder
WORKDIR /app

# Copy manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web

# Build dependencies & Next.js standalone
RUN pnpm --filter @omniflow/shared build
RUN pnpm --filter @omniflow/ui build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter @omniflow/web build

# STAGE 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy Next.js standalone output & static assets for monorepo
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
