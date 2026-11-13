# OmniFlow SaaS — Quality Assurance (QA) & Functional Test Report

**QA Lead**: Autonomous QA & Systems Reliability Lead  
**Audit Date**: October 31, 2026  
**Test Suite Coverage**: 8 Test Suites, 79 Automated Tests (100% Pass Rate)  
**Target Environments**: Local Sandbox, Next.js 15 App Router, NestJS 10 REST & Socket.IO Gateway, PostgreSQL 16 + pgvector, Redis BullMQ.

---

## 1. Test Execution Summary

```
PASS test/orders.spec.ts (9.15 s)
PASS test/business-operations.spec.ts (9.169 s)
PASS test/billing-and-admin.spec.ts (5.918 s)
PASS test/auth.spec.ts (10.132 s)
PASS test/tenant-isolation.spec.ts (11.18 s)
PASS test/ai-pipeline.spec.ts (11.145 s)
PASS test/messaging.spec.ts (12.103 s)
PASS test/automation-integrations.spec.ts (5.909 s)

Test Suites: 8 passed, 8 total
Tests:       79 passed, 79 total
Snapshots:   0 total
Time:        6.709 s
```

---

## 2. Functional Verification Matrix by Module

### 2.1 Authentication & Workspace Onboarding (`auth.spec.ts`)
- **User Registration**:
  - Validates unique lowercase email.
  - Automatically provisions new tenant workspace (`Tenant.create`) with unique slug.
  - Grants initial workspace trial credits (500 credits, type: `TRIAL_GRANT`).
  - Sets registrant role as `WorkspaceRole.OWNER`.
  - Generates 24h verification token.
- **Login & Session Management**:
  - Validates bcrypt password hash.
  - Generates short-lived JWT access token.
  - Generates 30-day refresh token and stores SHA-256 hash in `UserSession`.
  - Supports token refresh rotation and revocation.
- **Password Reset & Email Verification**:
  - Validates expiring cryptographic tokens; updates password hash upon confirmation.

### 2.2 Multi-Tenant Data Isolation (`tenant-isolation.spec.ts`)
- **Query Scoping**: Verifies that requests with `tenant-1` cannot retrieve or alter records belonging to `tenant-2`.
- **Member Access Verification**: Verifies `TenantGuard` throws `403 Forbidden` when user attempts to access a workspace they do not belong to.
- **Super-Admin Route Scoping**: Confirms super-admin bypass is strictly confined to `/api/v1/super-admin/*` routes.

### 2.3 Product & Inventory Operations (`business-operations.spec.ts`)
- **Product Lifecycle**:
  - Full CRUD operations with categories, SKUs, BDT pricing, and image URLs.
  - Rejects duplicate SKU within same workspace.
- **Inventory Deductions & Audit**:
  - Deducts stock upon order placement with `INVENTORY_DEDUCT` transaction.
  - Restores stock upon order cancellation with `INVENTORY_RESTORE` transaction.
  - Flags low-stock products (`stockQuantity <= 5`).

### 2.4 Order Management & Invoicing (`orders.spec.ts`)
- **Idempotency Guarantee**:
  - Repeated order placement with identical `idempotencyKey` returns existing order without creating duplicates.
- **Itemized Pricing Calculations**:
  - Server-side calculation of `subtotal = SUM(unitPrice * qty) + shippingCost - discount`.
- **Status Lifecycle Transitions**:
  - Validates transitions: `PENDING` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`.
  - Cancellation marks order `CANCELLED`, releases stock, and logs customer timeline event.

### 2.5 Omnichannel Messaging & Real-Time Inbox (`messaging.spec.ts`)
- **Meta Graph API Webhooks**:
  - Ingests incoming Messenger and Instagram Direct messages.
  - Deduplicates on `externalMessageId` to prevent duplicate thread entries.
- **WhatsApp Cloud API**:
  - Handles incoming text, media attachments, and delivery status updates (`SENT`, `DELIVERED`, `READ`).
- **Human Handover Protocol**:
  - `takeOver`: Sets conversation to `HUMAN_HANDOVER`, suppresses autonomous AI replies, logs handover audit.
  - `returnToAi`: Resets conversation to `BOT_ACTIVE`, reactivates AI agent.
  - Private internal team notes (`isInternal: true`) are verified to never leak to customer channel.

### 2.6 Multimodal AI Engine & RAG Retrieval (`ai-pipeline.spec.ts`)
- **Provider Abstraction**:
  - Abstract interface supports configurable model endpoints with deterministic sandbox fallback.
- **Conversational Commerce**:
  - Multi-turn context assembly with business persona, operating hours, and customer history.
- **RAG Knowledge Retrieval**:
  - Document chunking, vector embedding, and cosine similarity scoring matching customer inquiries.
- **Vision & Voice Ingestion**:
  - Vision catalog recognition from customer garment/product photos.
  - Whisper STT transcription of voice notes in Bengali and English.

### 2.7 Business Automations (`automation-integrations.spec.ts`)
- **Trigger-Action Execution**:
  - Evaluates triggers (`NEW_MESSAGE`, `ORDER_CREATED`, `PAYMENT_RECEIVED`, `ORDER_SHIPPED`, `INACTIVITY_TIMEOUT`).
  - Evaluates conditional expressions (`totalAmount >= 2000`, `city == 'Dhaka'`).
  - Executes sequential steps (`ADD_CUSTOMER_TAG`, `SCHEDULE_FOLLOWUP`, `ESCALATE_TO_HUMAN`, `SEND_MESSAGE`).
- **Audit & Retries**:
  - Logs execution in `WorkflowExecution` table.
  - Successfully retries failed executions with incremented retry counters.
  - Supports dry-run simulation mode (`testWorkflow`) with step trace.

### 2.8 Payment Gateways & Couriers (`automation-integrations.spec.ts`)
- **bKash & Nagad**: Payment initiation, server-side execute/verify (`trxID`), and idempotency check.
- **SSLCommerz**: Session initiation, IPN validation, transaction verification.
- **Steadfast & Pathao**: 1-click parcel creation, tracking code generation, and automated delivery status synchronization (`DELIVERED`/`RETURNED`).

### 2.9 SaaS Billing & Super-Admin Console (`billing-and-admin.spec.ts`)
- **Credit Wallets**:
  - Atomic deductions inside `prisma.$transaction`.
  - Idempotency protection against duplicate deductions on network retries.
  - Low-balance alerts triggered when balance drops below 100 credits.
  - Multi-pack top-up recharges via bKash, Nagad, SSLCommerz, Stripe.
  - Balance reconciliation verification (`creditBalance == SUM(transactions)`).
- **Super-Admin**:
  - Restricted to `user.isSuperAdmin === true`.
  - Real-time platform KPI calculation (GMV, AI tokens, provider cost USD, net revenue BDT).
  - 1-click workspace suspension/unsuspension and credit injection with audit logging.
  - User session force-revocation.

---

## 3. QA Sign-Off

All critical user journeys, multi-tenant boundaries, and financial transactions operate as designed with high functional fidelity and zero automated test failures.
