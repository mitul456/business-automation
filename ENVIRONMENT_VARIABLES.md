# OmniFlow — Environment Variables Catalog (`ENVIRONMENT_VARIABLES.md`)

This document catalogues every environment variable utilized across the **OmniFlow SaaS** monorepo services (`apps/api`, `apps/worker`, `apps/web`, and packages).

---

## 1. Core Server & Monorepo Runtime

| Variable Name | Required | Default Value | Security Level | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `development` | LOW | Node.js execution mode (`development`, `production`, `test`). |
| `PORT` | No | `4000` (API) / `3000` (Web) | LOW | TCP port the HTTP server binds to. |
| `APP_URL` | Yes | `http://localhost:3000` | LOW | Public frontend base URL (used for password reset links & email callbacks). |
| `API_URL` | Yes | `http://localhost:4000/api` | LOW | Public REST API base URL. |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | LOW | Client-side accessible frontend domain. |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000/api` | LOW | Client-side accessible backend API endpoint. |
| `NEXT_TELEMETRY_DISABLED` | No | `1` | LOW | Disables Next.js anonymous build metrics collection. |

---

## 2. Database & Data Storage

| Variable Name | Required | Default Value | Security Level | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | — | **CRITICAL** | MySQL / PostgreSQL connection string with credentials, e.g. `mysql://user:pass@host:3306/db?connection_limit=25`. |
| `DB_NAME` | Yes (Docker) | `omniflow_db` | MEDIUM | Target database name in Docker Compose. |
| `DB_USER` | Yes (Docker) | `omniflow` | MEDIUM | Dedicated non-root database user. |
| `DB_PASSWORD` | Yes (Docker) | — | **HIGH** | Dedicated database user password. |
| `DB_ROOT_PASSWORD` | Yes (Docker) | — | **CRITICAL** | Root superuser password for database provisioning. |

---

## 3. Redis & BullMQ Asynchronous Queues

| Variable Name | Required | Default Value | Security Level | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `REDIS_HOST` | Yes | `localhost` | MEDIUM | Hostname of the Redis server. |
| `REDIS_PORT` | No | `6379` | LOW | Port number of the Redis server. |
| `REDIS_PASSWORD` | Production | `""` | **HIGH** | Redis AUTH password for secure command execution. |
| `WORKER_CONCURRENCY` | No | `10` | LOW | Maximum number of concurrent BullMQ jobs processed simultaneously by a worker. |

---

## 4. Cryptography, JWT, & Secret Management

| Variable Name | Required | Default Value | Security Level | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `JWT_SECRET` | Yes | — | **CRITICAL** | HMAC-SHA256 secret key for signing short-lived (15m) access tokens. Minimum 32 characters. |
| `JWT_REFRESH_SECRET` | Yes | — | **CRITICAL** | HMAC-SHA256 secret key for signing long-lived (7d) refresh tokens. Minimum 32 characters. |
| `TOKEN_ENCRYPTION_KEY` | Yes | — | **CRITICAL** | 64-character hexadecimal key (256-bit) used for **AES-256-GCM** encryption of third-party credentials. |

> [!CAUTION]
> If `TOKEN_ENCRYPTION_KEY` is modified or lost, all existing encrypted channel tokens (Meta, WhatsApp, bKash, Steadfast) stored in the database will become unreadable.

---

## 5. Object Storage (S3 / MinIO)

| Variable Name | Required | Default Value | Security Level | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `S3_ENDPOINT` | Yes | `localhost:9000` | LOW | S3-compatible object storage endpoint hostname and port. |
| `S3_USE_SSL` | No | `false` | LOW | Set to `true` when connecting to AWS S3 or an SSL-terminated MinIO host. |
| `S3_ACCESS_KEY` | Yes | `minioadmin` | **HIGH** | S3 API access key / root user identifier. |
| `S3_SECRET_KEY` | Yes | `minioadminpassword` | **CRITICAL** | S3 API secret key / root user password. |
| `S3_BUCKET` | Yes | `omniflow-storage` | MEDIUM | S3 bucket name for knowledge base documents, invoices, and message media. |

---

## 6. Artificial Intelligence (OpenAI)

| Variable Name | Required | Default Value | Security Level | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `OPENAI_API_KEY` | Yes (for AI) | — | **HIGH** | OpenAI platform API key (`sk-proj-...`) powering GPT-4o, Whisper STT, and text-embedding-3. |
| `OPENAI_ORG_ID` | No | — | LOW | Optional OpenAI Organization ID for multi-org accounts. |

---

## 7. Omnichannel Providers (Meta, WhatsApp)

| Variable Name | Required | Default Value | Security Level | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `META_APP_ID` | For Meta OAuth | — | MEDIUM | Meta Developer App ID for Facebook & Instagram OAuth flow. |
| `META_APP_SECRET` | For Meta OAuth | — | **HIGH** | Meta Developer App Secret for code exchange and webhook HMAC SHA-256 verification. |
| `META_WEBHOOK_VERIFY_TOKEN`| For Meta Webhook | — | **HIGH** | Shared secret token passed during Meta webhook verification challenge. |
| `WHATSAPP_PHONE_NUMBER_ID`| For WhatsApp API | — | MEDIUM | Default/Platform WhatsApp Business Phone Number ID. |
| `WHATSAPP_ACCESS_TOKEN`| For WhatsApp API | — | **HIGH** | Permanent System User Token with `whatsapp_business_messaging` permissions. |

---

## 8. Payment Gateways (bKash, Nagad, SSLCommerz, Stripe)

| Variable Name | Required | Default Value | Security Level | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `BKASH_APP_KEY` | For bKash | — | **HIGH** | bKash Merchant App Key. |
| `BKASH_APP_SECRET` | For bKash | — | **CRITICAL** | bKash Merchant App Secret. |
| `BKASH_USERNAME` | For bKash | — | MEDIUM | bKash Merchant API Username. |
| `BKASH_PASSWORD` | For bKash | — | **HIGH** | bKash Merchant API Password. |
| `BKASH_SANDBOX` | No | `true` | LOW | Set to `false` for live production bKash transactions. |
| `NAGAD_MERCHANT_ID` | For Nagad | — | MEDIUM | Nagad PG Merchant ID. |
| `NAGAD_PRIVATE_KEY` | For Nagad | — | **CRITICAL** | Merchant RSA Private Key for request signing. |
| `NAGAD_PUBLIC_KEY` | For Nagad | — | MEDIUM | Nagad PG Public Key for response signature verification. |
| `SSLCOMMERZ_STORE_ID` | For SSLCommerz | — | MEDIUM | SSLCommerz Store ID. |
| `SSLCOMMERZ_STORE_PASSWD`| For SSLCommerz | — | **HIGH** | SSLCommerz Store Password. |
| `STRIPE_SECRET_KEY` | For Stripe | — | **CRITICAL** | Stripe Secret API Key (`sk_live_...` or `sk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | For Stripe | — | **HIGH** | Stripe Webhook Signing Secret (`whsec_...`). |

---

## 9. Courier Logistics (Steadfast, Pathao)

| Variable Name | Required | Default Value | Security Level | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `STEADFAST_API_KEY` | For Steadfast | — | **HIGH** | Steadfast Courier API Key. |
| `STEADFAST_SECRET_KEY` | For Steadfast | — | **HIGH** | Steadfast Courier Secret Key. |
| `PATHAO_CLIENT_ID` | For Pathao | — | MEDIUM | Pathao Courier Developer Client ID. |
| `PATHAO_CLIENT_SECRET` | For Pathao | — | **CRITICAL** | Pathao Courier Developer Client Secret. |
| `PATHAO_USERNAME` | For Pathao | — | MEDIUM | Registered Pathao Merchant login email. |
| `PATHAO_PASSWORD` | For Pathao | — | **HIGH** | Registered Pathao Merchant login password. |
