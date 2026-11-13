# OmniFlow — Developer Installation & Local Setup Guide (`INSTALLATION.md`)

This guide walks software engineers through setting up a complete, isolated local development environment for the **OmniFlow** multi-tenant SaaS monorepo.

---

## 1. System Requirements & Prerequisites

Ensure your host machine satisfies the following minimum specifications:

| Requirement | Minimum | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Operating System** | macOS 12+, Ubuntu 22.04+, Windows 11 (WSL2) | Linux / macOS / Windows 11 | Docker performance is optimal on Linux/WSL2 |
| **Node.js** | `v20.12.0` (LTS) | `v20.x` | Do not use Node 18 or 22+ without testing |
| **Package Manager** | `pnpm v12.16.1` | `pnpm v12.16.1` | Enabled via Corepack |
| **Docker** | Docker Engine `24.0+` | Docker Desktop / Docker CE | Needed for MySQL, Redis, and MinIO |
| **Memory (RAM)** | 8 GB | 16 GB+ | Monorepo concurrent builds require headroom |
| **Disk Space** | 10 GB free | 25 GB free | Docker volumes and build caches |

### Install Core Tools:
```bash
# Verify Node.js version
node -v  # Must be >= 20.0.0

# Enable pnpm via Node.js Corepack
corepack enable
corepack prepare pnpm@12.16.1 --activate

# Verify pnpm installation
pnpm -v  # Output: 12.16.1
```

---

## 2. Repository Setup

```bash
# 1. Clone repository
git clone https://github.com/omniflow-saas/omniflow.git
cd omniflow

# 2. Install monorepo dependencies
pnpm install
```

---

## 3. Local Infrastructure (Docker Compose)

OmniFlow requires MySQL 8.0, Redis 7, and MinIO (S3-compatible object storage) running locally.

Start the background container stack:
```bash
docker compose -f docker/docker-compose.yml up -d
```

Verify all containers are healthy:
```bash
docker ps
```
You should see:
- `omniflow_mysql` listening on `127.0.0.1:3306`
- `omniflow_redis` listening on `127.0.0.1:6379`
- `omniflow_minio` listening on `127.0.0.1:9000` (API) and `127.0.0.1:9001` (Console)

To access the MinIO web console:
- URL: `http://localhost:9001`
- Username: `minioadmin`
- Password: `minioadminpassword`

---

## 4. Environment Configuration

Copy the example environment configuration into the root `.env` file:
```bash
cp .env.example .env
```

Verify or update the following core variables in your `.env`:
```ini
# Application Configuration
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:4000/api

# Database Configuration (matches local docker-compose.yml)
DATABASE_URL="mysql://omniflow:omniflow_pass@localhost:3306/omniflow_db"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""

# Cryptographic Keys (Must be 32+ characters)
JWT_SECRET=dev_jwt_secret_key_omniflow_local_development_32chars
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key_omniflow_local_development
TOKEN_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# MinIO / S3 Configuration
S3_ENDPOINT=localhost:9000
S3_USE_SSL=false
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadminpassword
S3_BUCKET=omniflow-storage

# AI Provider (Optional for basic testing; required for AI playground)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

---

## 5. Database Schema & Prisma Client

Push the schema to your local MySQL database and regenerate the type-safe client:

```bash
# Push schema structure to MySQL
pnpm --filter @omniflow/database prisma db push

# Generate Prisma Client across monorepo packages
pnpm --filter @omniflow/database prisma generate
```

Optional: To inspect the database visually, start Prisma Studio:
```bash
pnpm --filter @omniflow/database prisma studio
# Opens at http://localhost:5555
```

---

## 6. Running Development Services

You can start the full monorepo stack concurrently, or run individual services as needed:

### Option A: Run Full Stack Concurrently
```bash
pnpm dev
```
This boots:
- Web Client (`apps/web`): `http://localhost:3000`
- API Backend (`apps/api`): `http://localhost:4000`
- Background Worker (`apps/worker`): Background queue loop

### Option B: Run Specific Services Separately (Recommended for Debugging)

Terminal 1 (Backend API):
```bash
pnpm --filter @omniflow/api start:dev
```

Terminal 2 (BullMQ Worker):
```bash
pnpm --filter @omniflow/worker start:dev
```

Terminal 3 (Next.js Web Client):
```bash
pnpm --filter @omniflow/web dev
```

---

## 7. Running Quality Gates & Tests

Before creating pull requests, execute all verification suites:

```bash
# 1. Run ESLint across all workspaces
pnpm run lint

# 2. Run unit and integration tests (Jest)
pnpm run test

# 3. Test production build compilation
pnpm run build
```

---

## 8. Troubleshooting Common Setup Issues

### Issue 1: Database Connection Refused (`ECONNREFUSED 127.0.0.1:3306`)
- Check whether the Docker container is running: `docker ps`
- Inspect MySQL container logs: `docker logs omniflow_mysql`
- Ensure port 3306 is not in use by a local native MySQL/MariaDB server (`netstat -ano | findstr 3306` on Windows or `lsof -i :3306` on Mac/Linux).

### Issue 2: Prisma Client Out of Sync
If TypeScript complains that a newly added model does not exist on `PrismaClient`:
```bash
pnpm --filter @omniflow/database prisma generate
```
Restart your IDE TypeScript Language Server (`Cmd+Shift+P` -> `TypeScript: Restart TS Server` in VSCode).

### Issue 3: Redis Connection Error (`ECONNREFUSED 127.0.0.1:6379`)
- Ensure Redis is running: `docker exec -it omniflow_redis redis-cli ping` (should reply `PONG`).
- Check if `.env` has `REDIS_HOST=localhost` and `REDIS_PORT=6379`.

### Issue 4: Next.js Cache Invalidation
If UI components fail to update or cache invalid CSS tokens:
```bash
rm -rf apps/web/.next
pnpm --filter @omniflow/web dev
```
