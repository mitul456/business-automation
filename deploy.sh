#!/usr/bin/env bash
# ==============================================================================
# OmniFlow SaaS — Production Deployment Script for https://omniflow.antcodes.dev
# ==============================================================================
set -euo pipefail

DOMAIN="omniflow.antcodes.dev"
echo "=========================================================="
echo " Starting OmniFlow SaaS Deployment for https://${DOMAIN}"
echo " Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================================="

# 1. Check Root or Necessary Tooling
command -v node >/dev/null 2>&1 || { echo >&2 "Error: Node.js (v20+ or v22+) is required. Aborting."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo >&2 "Error: pnpm is required. Please install with 'npm i -g pnpm'. Aborting."; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo >&2 "Error: pm2 is required. Please install with 'npm i -g pm2'. Aborting."; exit 1; }

# 2. Check Environment Configuration
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        echo "Creating .env from .env.production..."
        cp .env.production .env
    else
        echo >&2 "Error: Neither .env nor .env.production found. Please create one before running deploy.sh."
        exit 1
    fi
fi

# 3. Install Workspace Dependencies
echo "Installing monorepo dependencies with pnpm..."
pnpm install --frozen-lockfile

# 4. Generate Database Client & Apply Migrations
echo "Generating Prisma ORM Client..."
pnpm --filter @omniflow/database prisma generate

echo "Applying production database migrations..."
pnpm --filter @omniflow/database prisma migrate deploy

# 5. Build Workspace Packages and Applications
echo "Building all packages and applications..."
pnpm run build

# 6. PM2 Process Orchestration
echo "Reloading PM2 cluster services (Zero-Downtime)..."
if pm2 describe omniflow-api > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js --update-env
else
    pm2 start ecosystem.config.js
fi
pm2 save

# 7. Verification & Health Checks
echo "Waiting 5 seconds for services to initialize..."
sleep 5

echo "Verifying API Health..."
if curl -s -f http://127.0.0.1:4000/api/v1/health > /dev/null 2>&1; then
    echo "✓ API is healthy at http://127.0.0.1:4000/api/v1/health"
else
    echo "⚠ Warning: API health check endpoint did not return HTTP 200. Check 'pm2 logs omniflow-api'."
fi

echo "Verifying Web Frontend..."
if curl -s -f http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo "✓ Web Frontend is serving at http://127.0.0.1:3000"
else
    echo "⚠ Warning: Web frontend did not return HTTP 200. Check 'pm2 logs omniflow-web'."
fi

echo "=========================================================="
echo " OmniFlow SaaS successfully deployed!"
echo " Live URL: https://${DOMAIN}/"
echo " Super Admin URL: https://${DOMAIN}/admin"
echo " PM2 Dashboard: Run 'pm2 status' or 'pm2 logs'"
echo "=========================================================="
