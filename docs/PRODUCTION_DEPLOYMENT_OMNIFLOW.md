# OmniFlow SaaS — Production Deployment Manual
**Target Production Domain**: `https://omniflow.antcodes.dev/`  
**Platform**: Next.js 15, NestJS 10, BullMQ, MySQL 8.0, Redis 7, Nginx Reverse Proxy, Socket.IO

---

## 1. Architecture Overview for `omniflow.antcodes.dev`

Under production deployment on `omniflow.antcodes.dev`, Nginx operates as the edge reverse proxy and SSL termination point, routing traffic smoothly to internal services without CORS overhead:

```
                          Internet (HTTPS: 443)
                                    │
                                    ▼
                ┌───────────────────────────────────────┐
                │   Nginx Reverse Proxy & SSL Router    │
                │     (https://omniflow.antcodes.dev)   │
                └───────────────────┬───────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
    Next.js 15 Web         NestJS 10 REST API      Socket.IO WebSockets
    (Port 3000)             (Port 4000)             (Port 4000 /socket.io)
    Location: /             Location: /api/         Location: /socket.io/
                                    │
            ┌───────────────────────┴───────────────────────┐
            │                                               │
            ▼                                               ▼
       MySQL 8.0                                         Redis 7
   (Database Port 3306)                         (BullMQ & Cache Port 6379)
                                                            ▲
                                                            │
                                                   BullMQ Worker Engine
                                                   (Background Process)
```

---

## 2. Server Prerequisites (Ubuntu 22.04 / 24.04 LTS)

Recommended specifications for production VPS (DigitalOcean, Hetzner, AWS EC2, or Linode):
- **CPU**: 2+ vCPUs
- **RAM**: 4 GB+ (minimum 2 GB with 2 GB Swap)
- **Disk**: 40 GB+ NVMe SSD
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS

### Step 2.1: Update Server & Install Core Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw
```

### Step 2.2: Install Node.js 22 LTS & pnpm
```bash
# Install Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Should output v22.x.x
npm -v

# Install pnpm and pm2 globally
sudo npm install -g pnpm pm2
```

### Step 2.3: Install & Configure MySQL 8.0
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Log in to MySQL root
sudo mysql -u root -p
```
Inside MySQL shell:
```sql
CREATE DATABASE IF NOT EXISTS omniflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'omniflow_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'omniflow_secure_db_pass_2026';
GRANT ALL PRIVILEGES ON omniflow_db.* TO 'omniflow_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 2.4: Install & Configure Redis 7
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping  # Returns PONG
```

---

## 3. DNS Configuration (A Record)

In your DNS Management Panel (Cloudflare, Namecheap, GoDaddy, etc.):
1. Add an **A Record**:
   - **Type**: `A`
   - **Name**: `omniflow` (resolves to `omniflow.antcodes.dev`)
   - **IPv4 Address**: `YOUR_VPS_PUBLIC_IP`
   - **TTL**: Auto or 300 seconds
   - **Cloudflare Proxy**: Temporarily set to **DNS Only (Grey Cloud)** while generating SSL certificates with Certbot, then you can enable Proxy (Orange Cloud) with SSL mode set to **Full (Strict)**.

---

## 4. Method A: Native VPS Deployment with PM2 (Recommended)

### Step 4.1: Clone the Codebase
```bash
cd /var/www
sudo git clone <YOUR_GIT_REPO_URL> omniflow
sudo chown -R $USER:$USER /var/www/omniflow
cd /var/www/omniflow
```

### Step 4.2: Setup Production Environment
```bash
cp .env.production .env
nano .env
```
Ensure the values are set:
```env
NODE_ENV=production
PORT=4000
WEB_PORT=3000
APP_BASE_URL=https://omniflow.antcodes.dev
NEXT_PUBLIC_APP_URL=https://omniflow.antcodes.dev
NEXT_PUBLIC_API_URL=https://omniflow.antcodes.dev/api/v1
NEXT_PUBLIC_SOCKET_URL=https://omniflow.antcodes.dev
DATABASE_URL=mysql://omniflow_user:omniflow_secure_db_pass_2026@127.0.0.1:3306/omniflow_db?connection_limit=25
REDIS_URL=redis://127.0.0.1:6379
ENCRYPTION_SECRET=omniflow_prod_aes256_secret_key_32bytes_2026!
JWT_SECRET=omniflow_prod_jwt_super_secret_signing_key_998877!
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY
```

### Step 4.3: One-Command Build & Launch
Make `deploy.sh` executable and run it:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Step 4.4: Enable PM2 Startup on Boot
```bash
pm2 save
pm2 startup
# Run the command generated by pm2 startup (starts with sudo env PATH...)
```

---

## 5. Method B: Docker Compose Deployment (Alternative)

If you prefer containerized deployment:

```bash
cd /var/www/omniflow
cp .env.production .env

# Build and start all 8 containers in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations inside container
docker exec -it omniflow_prod_api pnpm --filter @omniflow/database prisma migrate deploy

# Check container status
docker compose -f docker-compose.prod.yml ps
```

---

## 6. Nginx & SSL Certificate Configuration

### Step 6.1: Copy Nginx Site Configuration
Create `/etc/nginx/sites-available/omniflow.conf`:
```bash
sudo cp docker/nginx/conf.d/omniflow.conf /etc/nginx/sites-available/omniflow.conf
sudo ln -s /etc/nginx/sites-available/omniflow.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### Step 6.2: Obtain Free SSL Certificate via Let's Encrypt Certbot
```bash
sudo certbot --nginx -d omniflow.antcodes.dev
```
Certbot will automatically verify ownership of `omniflow.antcodes.dev`, generate production SSL certificates, and configure HTTPS in `/etc/nginx/sites-available/omniflow.conf`.

### Step 6.3: Verify & Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Webhook & Integration Configuration for `omniflow.antcodes.dev`

Configure the following live webhook URLs in your third-party developer consoles:

| Integration Provider | Webhook / Callback URL | Verification / Settings |
| :--- | :--- | :--- |
| **Meta (Facebook Messenger)** | `https://omniflow.antcodes.dev/api/v1/webhooks/meta` | Verify Token: matches `META_VERIFY_TOKEN` in `.env` |
| **Meta (Instagram Direct)** | `https://omniflow.antcodes.dev/api/v1/webhooks/meta` | Subscriptions: `messages`, `messaging_postbacks` |
| **WhatsApp Business API** | `https://omniflow.antcodes.dev/api/v1/webhooks/whatsapp` | Verify Token: matches `META_VERIFY_TOKEN` in `.env` |
| **bKash Tokenized Callback** | `https://omniflow.antcodes.dev/api/v1/payments/callback/bkash` | Configured in bKash Merchant Portal |
| **Nagad Direct Callback** | `https://omniflow.antcodes.dev/api/v1/payments/callback/nagad` | Configured in Nagad Merchant Portal |
| **Stripe Webhook** | `https://omniflow.antcodes.dev/api/v1/payments/callback/stripe` | Events: `checkout.session.completed`, `payment_intent.succeeded` |

---

## 8. Operational Commands & Maintenance

### View Logs
```bash
# Real-time PM2 logs
pm2 logs

# Or individual service logs
pm2 logs omniflow-api
pm2 logs omniflow-worker
pm2 logs omniflow-web

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Zero-Downtime Deployment
To pull latest updates and deploy with zero downtime:
```bash
cd /var/www/omniflow
git pull origin main
./deploy.sh
```

### Database Backup
Automate daily MySQL database backup:
```bash
crontab -e
```
Add the following line to run daily at 3:00 AM:
```cron
0 3 * * * mysqldump -u omniflow_user -pomniflow_secure_db_pass_2026 omniflow_db | gzip > /var/backups/omniflow_db_$(date +\%F).sql.gz
```
