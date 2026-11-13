# OmniFlow — Production Deployment Runbook (`DEPLOYMENT.md`)

This runbook outlines the standard operating procedure for deploying and managing **OmniFlow SaaS** in production environments.

---

## 1. Production Topology & Hardware Sizing

OmniFlow uses a containerized multi-tier architecture orchestrated via Docker Compose or Kubernetes.

```
                          ┌────────────────────────┐
                          │ Internet / Cloudflare  │
                          └───────────┬────────────┘
                                      │ (Ports 80 / 443)
                                      ▼
                        ┌───────────────────────────┐
                        │ Nginx Reverse Proxy (SSL) │
                        └──────┬─────────────┬──────┘
                               │             │
                ┌──────────────┘             └──────────────┐
                ▼ (/ , /_next)                              ▼ (/api, /socket.io)
      ┌──────────────────┐                        ┌──────────────────┐
      │ Next.js Web App  │                        │  NestJS Core API │
      │ (apps/web:3000)  │                        │ (apps/api:4000)  │
      └──────────────────┘                        └────────┬─────────┘
                                                           │
                                        ┌──────────────────┼──────────────────┐
                                        ▼                  ▼                  ▼
                               ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐
                               │ BullMQ Worker   │ │ MySQL 8.0     │ │ Redis 7 AOF     │
                               │ (apps/worker)   │ │ (Persistent)  │ │ (Queues & Cache)│
                               └─────────────────┘ └───────────────┘ └─────────────────┘
                                                           │
                                                           ▼
                                                   ┌───────────────┐
                                                   │ MinIO / S3    │
                                                   │ (Object Store)│
                                                   └───────────────┘
```

### Hardware Sizing Matrix:

| Tier | Active Tenants | Concurrent Users | Recommended Sizing | Storage |
| :--- | :--- | :--- | :--- | :--- |
| **Small (Entry)** | 1 - 25 | Up to 100 | 2 vCPU, 4 GB RAM | 40 GB NVMe SSD |
| **Standard (Production)** | 25 - 200 | Up to 1,000 | 4 vCPU, 8 GB RAM | 100 GB NVMe SSD |
| **Enterprise / Cluster** | 200 - 1,000+ | 10,000+ | Multi-Node: 8+ vCPU, 16+ GB RAM (Managed DB) | 500 GB+ NVMe / S3 |

---

## 2. DNS & Networking Configuration

Configure your domain DNS registrar with the following records pointing to your production host:

| Type | Name | Value | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `A` | `@` (or `omniflow.app`) | `203.0.113.10` (Server IP) | 300s | Primary application entry |
| `A` | `api` (or `api.omniflow.app`) | `203.0.113.10` | 300s | Direct API access (optional) |
| `CNAME`| `www` | `omniflow.app` | 300s | Canonical redirect |

Ensure inbound firewall rules (e.g. `ufw` or AWS Security Groups) permit:
- `80/tcp` (HTTP — redirected to HTTPS & Certbot ACME)
- `443/tcp` (HTTPS — secure application traffic)
- `22/tcp` (SSH — restricted to trusted operator IP addresses)
- **Deny all direct public access to ports `3000`, `3306`, `4000`, `6379`, `9000`, and `9001`**.

---

## 3. Server Provisioning & Initial Setup

Log into your target Ubuntu 22.04 / Debian 12 server:

```bash
# 1. Update OS packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker & Docker Compose Plugin
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 3. Create deployment directory
sudo mkdir -p /opt/omniflow
sudo chown -R $USER:$USER /opt/omniflow
cd /opt/omniflow
```

---

## 4. Production Environment Configuration

Create `/opt/omniflow/.env`:

```ini
# Core Environment
NODE_ENV=production
APP_URL=https://omniflow.app
API_URL=https://omniflow.app/api

# Database Credentials
DB_NAME=omniflow_prod_db
DB_USER=omniflow_prod_user
DB_PASSWORD=GENERATE_STRONG_RANDOM_PASSWORD_64_CHARS
DB_ROOT_PASSWORD=GENERATE_STRONG_ROOT_PASSWORD_64_CHARS

# Redis
REDIS_PASSWORD=GENERATE_STRONG_REDIS_PASSWORD_64_CHARS

# Cryptographic Keys (Run: openssl rand -hex 32)
JWT_SECRET=b63c6...9f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
JWT_REFRESH_SECRET=78da...0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
TOKEN_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# MinIO / Object Storage
MINIO_ROOT_USER=omniflow_admin
MINIO_ROOT_PASSWORD=GENERATE_STRONG_MINIO_PASSWORD_64_CHARS
S3_BUCKET=omniflow-prod-storage

# AI Provider
OPENAI_API_KEY=sk-proj-prod-your-openai-api-key
```

> [!CAUTION]
> Generate unique 64-character hexadecimal keys for all passwords and encryption keys using `openssl rand -hex 32`. Never reuse local development keys.

---

## 5. SSL Certificate Initialization (Let's Encrypt)

Before launching Nginx with SSL enforcement, issue the initial TLS certificates via Certbot:

```bash
# 1. Temporarily start Nginx with HTTP-only to solve challenge
docker compose -f docker-compose.prod.yml up -d nginx

# 2. Request certificate from Let's Encrypt
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d omniflow.app \
  -d www.omniflow.app \
  --email security@omniflow.app \
  --agree-tos \
  --no-eff-email

# 3. Reload Nginx with full SSL enabled
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 6. Zero-Downtime Deployment Execution

Deploy the full application stack:

```bash
# 1. Build and boot all containers
docker compose -f docker-compose.prod.yml up -d --build

# 2. Run Database Migrations safely
docker compose -f docker-compose.prod.yml run --rm api pnpm --filter @omniflow/database prisma migrate deploy

# 3. Verify container health status
docker compose -f docker-compose.prod.yml ps
```

### Healthcheck Verification:
Verify the live health endpoint returns `HTTP 200`:
```bash
curl -I https://omniflow.app/api/v1/health
# Response: HTTP/2 200
# Body: {"status":"ok","timestamp":"2026-10-31T...","database":"up","redis":"up"}
```

---

## 7. Rolling Updates & Deployment Pipeline

When deploying new code releases:

```bash
#!/bin/bash
set -e

echo "Pulling latest code and Docker images..."
git pull origin main

echo "Rebuilding and pulling images..."
docker compose -f docker-compose.prod.yml build api worker web

echo "Running database schema migrations..."
docker compose -f docker-compose.prod.yml run --rm api pnpm --filter @omniflow/database prisma migrate deploy

echo "Rolling restart of application services..."
docker compose -f docker-compose.prod.yml up -d --no-deps api worker web

echo "Gracefully reloading Nginx..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "Verifying health..."
sleep 5
curl -f https://omniflow.app/api/v1/health || { echo "Health check failed!"; exit 1; }
echo "Deployment completed successfully!"
```

---

## 8. Rollback Procedure

If a deployed release introduces critical defects:

```bash
# 1. Check out previous known-good git commit or image tag
git checkout <PREVIOUS_STABLE_COMMIT_HASH>

# 2. Rebuild and restart application containers
docker compose -f docker-compose.prod.yml up -d --build --no-deps api worker web

# 3. If schema rollback is required, apply down migration or restore DB snapshot
# See BACKUP_RECOVERY.md for point-in-time database restoration steps.
```
