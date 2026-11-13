# OmniFlow SaaS — Known Issues, Operational Caveats & Production Deployment Checklist

**Auditor Persona**: Independent Senior Engineering Reviewer & Systems Reliability Lead  
**Audit Date**: October 31, 2026  
**Document Purpose**: Transparently list all known operational nuances, external dependency prerequisites, sandbox considerations, defects found and resolved during review, and pre-launch engineering requirements.

---

## 1. Defects Identified & Resolved in Senior Review

### 1.1 Defect: Redis Connection Fallback in API Health & Worker Engine
- **Component**: `apps/api/src/health/health.controller.ts` & `apps/worker/src/index.ts`
- **Defect Description**: The services initialized `new IORedis(redisUrl)` where `redisUrl` defaulted to `process.env.REDIS_URL || 'redis://localhost:6379'`. In production Docker container environments, `REDIS_HOST: redis`, `REDIS_PORT: 6379`, and `REDIS_PASSWORD` were provided as separate environment variables rather than a combined URL. This caused the healthcheck probe and worker initialization to attempt connecting to `localhost:6379` without the AUTH password, resulting in `ECONNREFUSED` or `NOAUTH` errors.
- **Resolution**: Updated both `HealthController` and `apps/worker/src/index.ts` to inspect `process.env.REDIS_URL` first; if absent, they dynamically configure an `IORedis` connection object passing `{ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PASSWORD }`. Additionally, updated `docker-compose.prod.yml` to supply both `REDIS_URL` and structured credentials.

### 1.2 Defect: Next.js Monorepo Standalone Static Asset Resolution
- **Component**: `apps/web/Dockerfile`
- **Defect Description**: When running Next.js in standalone mode within a monorepo, `server.js` resides at `/app/apps/web/server.js`. The Dockerfile only copied static build chunks to `/.next/static`. Under certain reverse proxy paths, Next.js expects the static chunks to reside relative to its package location at `/app/apps/web/.next/static`.
- **Resolution**: Updated `apps/web/Dockerfile` to copy static assets to both `./apps/web/.next/static` and `./.next/static`, and public files to both `./apps/web/public` and `./public`, guaranteeing that CSS and JS chunks are resolved under all runner contexts.

### 1.3 Defect: Incomplete Sign Out & Client-Side Session Retention
- **Component**: `apps/web/lib/auth-context.tsx` & `apps/web/app/(dashboard)/layout.tsx`
- **Defect Description**: When clicking Sign Out, `logout()` only removed `localStorage` values without performing a backend session invalidation, cookie clearing, or browser history replacement. More critically, `initAuth()` in `auth-context.tsx` was falling back to `setDefaultDemo()` whenever a token was absent, immediately reinstating a logged-in demo user session. Furthermore, dashboard layouts lacked route-level redirection for unauthenticated visitors.
- **Resolution**:
  1. Updated `logout()` to call backend `/api/v1/auth/logout`, clear `localStorage`, `sessionStorage`, and expired auth cookies, and execute a hard `window.location.replace('/login')` to prevent Back-button recovery of protected dashboard state.
  2. Removed `setDefaultDemo()` on missing token in `initAuth()`.
  3. Added client route protection in `DashboardLayout` redirecting `!user` to `/login` with an authenticating spinner.
  4. Added dedicated Sign Out controls in the Super Admin Console and mobile slide-out drawer.

### 1.4 Security Defect: Super-Admin Sidebar Link Exposure & Unauthorized Route Navigation
- **Component**: `apps/web/app/(dashboard)/layout.tsx` & `apps/web/app/(admin)/layout.tsx` & `apps/web/app/(marketing)/layout.tsx`
- **Defect Description**: The Super-Admin Governance link was statically rendered in the dashboard sidebar without verifying `user.isSuperAdmin`. Consequently, regular users and newly registered accounts saw the Super-Admin link. Additionally, `/admin` lacked client-side layout authorization guards, and the public marketing footer exposed an internal link to the Super-Admin portal.
- **Resolution**:
  1. Wrapped the Super-Admin Governance sidebar link in both desktop and mobile layouts strictly with `{user?.isSuperAdmin && ( ... )}`.
  2. Implemented strict route-level protection in `apps/web/app/(admin)/layout.tsx` redirecting unauthenticated users to `/login` and non-super-admin users to `/dashboard`.
  3. Removed the Super-Admin link from the public marketing footer.
  4. Enforced explicit `isSuperAdmin: false` in backend user registration `auth.service.ts` and validated via automated test suite.
  5. Added `apps/api/test/security-verification.spec.ts` verifying that `SuperAdminGuard` strictly blocks standard users with `403 Forbidden`.

### 1.5 Enhancement: AI Multimodal Visual Search, Full Product Gallery, Stock Verification & In-Chat Instant Orders
- **Component**: `apps/api/src/ai-agent/ai-pipeline.service.ts`, `apps/api/src/inbox/inbox.service.ts`, `apps/web/app/(dashboard)/inbox/page.tsx`
- **Enhancement Scope**:
  1. **Visual Search & Gallery Indexing**: Integrated GPT-4o Vision to analyze customer product screenshots and match against store database across `name`, `description`, `visualTags`, and all `images` (gallery photos).
  2. **Zero-Hallucination Inventory Check**: Real-time DB lookup for variants (e.g. Size 38, 40, 42 in-stock, Size 44 out-of-stock). If out-of-stock, politely notifies customer without hallucinating availability.
  3. **Interactive In-Chat Product Card**: Renders gallery photo carousel (multiple angles), variant selector pills with live stock counts, and "Buy Now / অর্ডার করুন" button directly in chat stream.
  4. **In-Chat Quick Order Placement**: Clicking "Buy Now" triggers order placement modal with automatic BDT shipping calculation (৳60 Inside Dhaka / ৳120 Outside Dhaka), creates order in DB (`#ORD-XXXX`) with atomic inventory decrement, and appends an `ORDER_CARD` to the conversation.
  5. **Whisper STT & TTS Voice Reply**: Transcribes Bengali & English voice notes into text using Whisper-1, processes intent, and provides an audio player with OpenAI TTS-1 (`nova` voice) playback.
- **Verification**: Verified across 9 test suites (90 tests total passing 100%) and clean Next.js build.

### 1.6 Defect & Enhancement: Credit Top-Up Workflow, Dynamic Payment Gateways, Dynamic API Manager & Super Admin Verification Queue
- **Component**: `apps/web/app/(dashboard)/billing/page.tsx`, `apps/web/app/(admin)/admin/page.tsx`, `apps/api/src/billing/`, `apps/api/src/super-admin/`
- **Defect Description**:
  1. In `/billing`, clicking "Continue" after selecting a pack executed a fake client-side `setTimeout` and immediately showed a fake receipt, completely bypassing backend payment creation. No real bKash/Nagad merchant instructions or TrxID inputs existed, and refresh reverted balance to database values.
  2. Super Admin lacked a dynamic payment method manager (bKash, Nagad, Stripe, merchant numbers, min/max limits, sandbox toggles) and dynamic external API configuration manager with live latency ping tests.
  3. Super Admin lacked a centralized queue for verifying and approving pending user bKash/Nagad top-up requests.
- **Resolution**:
  1. **Prisma Schema Discipline**: Added `CreditTopupRequest`, `PaymentMethodConfig`, and `DynamicApiConfig` models with AES-256-GCM encryption for stored API secrets.
  2. **Multi-Step Billing Flow**:
     - Step 1: User selects credit pack (500, 2000, 5000, 15000 credits) and payment method.
     - Step 2: Creates real backend `CreditTopupRequest` (`status: PENDING`).
     - Manual bKash/Nagad: Displays merchant number with 1-click copy, Bengali instructions, and inputs for Customer Mobile and TrxID.
     - Submitting TrxID transitions to "Pending Review" state (credits are NEVER added before verification).
     - Automated Stripe: Directly processes card payment, verifies server-side, atomically credits wallet, and generates itemized receipt.
  3. **Super Admin Payment Approvals Queue**: Super Admin sees all pending top-up requests and can 1-click "Approve" (atomically increments workspace credit balance and creates immutable `AiCreditTransaction`) or "Reject" with audit reason.
  4. **Dynamic Payment Gateway Manager**: Full CRUD for payment methods (bKash, Nagad, Stripe) with merchant number, instructions, active/disabled toggles, and encrypted credentials.
  5. **Dynamic API Integrations Manager**: Added OpenAI, Meta Graph API, WhatsApp Cloud API, Steadfast, Pathao, bKash, Nagad, and Stripe managers with "Test Connection" button executing live HTTP ping and displaying latency in milliseconds.
  6. **Automated Test Coverage**: Added `billing-topup-workflow.spec.ts` (7 tests) and `super-admin-payment-api.spec.ts` (6 tests). Total 11 test suites and 103 tests passing (100% pass rate).

---

## 2. Operational Notes & Sandbox Considerations

### 2.1 Third-Party Merchant Credentials & Sandbox Behaviors
- **bKash Tokenized Checkout**:
  - The client adapter supports both sandbox (`https://tokenized.sandbox.bka.sh/v1.2.0-beta`) and live production endpoints.
  - In sandbox mode without live merchant keys, the client produces deterministic test responses (`TRX_SANDBOX_...`). For live payments, merchant operators must bind real `App Key`, `App Secret`, `Username`, and `Password` in the Integrations Hub.
- **Nagad Direct PG**:
  - Requires public/private key-pair cryptography for remote signatures. Sandbox fallback generates test references. Production deployment requires official Nagad Merchant Onboarding.
- **SSLCommerz Gateway**:
  - Configured with default store credentials (`testbox` / `qwerty`) in sandbox mode. For production, merchant store credentials and live IPN URL registration with SSLCommerz NOC are required.
- **Steadfast Courier & Pathao Courier**:
  - Both courier clients feature test-mode fallbacks to prevent test runs from blocking on external network timeouts. Production live parcel booking requires active merchant portal API tokens.
- **Meta / WhatsApp Cloud API**:
  - Webhooks require a publicly accessible HTTPS domain (e.g. ngrok or deployed staging domain). Webhook verification tokens must match between Meta App Developer dashboard and `.env` (`META_VERIFY_TOKEN`).

---

## 3. Pre-Production Launch Checklist

Before deploying OmniFlow to live production infrastructure, complete the following steps:

- [ ] **Generate Production Encryption Secrets**:
  - Run `openssl rand -hex 32` to generate dedicated keys for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `TOKEN_ENCRYPTION_KEY` in `.env`.
- [ ] **Configure Production Database**:
  - Apply Prisma migrations on PostgreSQL 16 / MySQL with vector/text indexing: `pnpm --filter @omniflow/database prisma migrate deploy`.
- [ ] **Bind Meta App Review Credentials**:
  - Bind approved `App ID`, `App Secret`, and verify tokens in Meta Developer Console.
- [ ] **Provision Redis Cluster**:
  - Ensure Redis 7.x with AOF persistence is connected for BullMQ queue stability.
- [ ] **Register SSLCommerz & bKash Webhook IPNs**:
  - Register public callback URLs with payment aggregators.
- [ ] **Run End-to-End Smoke Test**:
  - Execute full test suite `pnpm test` to verify zero regressions.
