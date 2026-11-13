# Phase 10-11: SaaS Billing Infrastructure & Independent Super-Admin Console

This document specifies the technical architecture, financial integrity controls, and administrative governance for the **Credit Wallet Engine**, **Usage Ledger**, and **Super-Admin Console** in OmniFlow SaaS.

---

## 1. Credit Wallet Engine & Pricing Unit Economics

Each workspace tenant has a dedicated credit wallet (`Tenant.creditBalance`) with strict server-side accounting.

### Pricing Matrix & Cost Calculations

| Operation | AI Provider & Model | Unit Credits | Provider Unit Cost (USD) | Customer Charge (BDT) |
| :--- | :--- | :--- | :--- | :--- |
| **Conversational Chat** | `gpt-4o` | 1 Credit | $2.50 / $10.00 per 1M tokens | ৳0.70 |
| **High-Efficiency Chat** | `gpt-4o-mini` | 1 Credit | $0.15 / $0.60 per 1M tokens | ৳0.70 |
| **Visual Catalog Match** | `gpt-4o-vision` | 3 Credits | $5.00 / $15.00 per 1M tokens | ৳2.10 |
| **Voice Audio STT** | `whisper-1` | 2 Credits | $0.006 per minute | ৳1.40 |
| **Vector Embeddings** | `text-embedding-3-small`| 1 Credit | $0.02 per 1M tokens | Free Included in RAG |

### Credit Lifecycle Operations

1. **Initial Trial Credits**: New workspaces receive an automatic grant (default: 500 credits, type: `TRIAL_GRANT`).
2. **Credit Purchases & Top-Ups**: Recharges via bKash, Nagad, SSLCommerz, or Stripe (packs of 500, 2,000, 5,000, 15,000 credits).
3. **Atomic Deductions**: `BillingService.deductCredits` atomically decrements balance, creates an immutable ledger entry in `AiCreditTransaction`, and appends an `AiUsageLog` record.
4. **Refund Adjustments**: Reverses credits if an AI generation fails or transaction is returned (type: `REFUND`).
5. **Admin Injections**: Root console credit grants with mandatory justification notes (type: `ADMIN_ADJUSTMENT`).
6. **Low-Balance Alerts**: Automated threshold check (`Tenant.lowCreditThreshold = 100`). If balance drops below threshold, flags alert banner and prevents silent bot failure.
7. **Usage Limits**: Monthly safety limit prevents runaway bot loops from exhausting credits.

---

## 2. Financial Integrity & Reconciliation

- **Atomic Transactions**: All wallet adjustments execute inside PostgreSQL transactions (`prisma.$transaction`).
- **Idempotency Protection**: Every top-up, deduction, and payment verification requires a unique `idempotencyKey`. Duplicate attempts return `ALREADY_PROCESSED` without double crediting or debiting.
- **Immutable Ledger**: Transactions are append-only; balance after every transaction is stored alongside the debit/credit.
- **Balance Reconciliation**: `BillingService.reconcileTenantBalance` verifies that `creditBalance == SUM(AiCreditTransaction.amount)`.

---

## 3. Super-Admin Architecture

The Super-Admin interface is isolated behind `SuperAdminGuard`:

### Security Safeguards:
- Strict `req.user.isSuperAdmin === true` validation.
- Masked third-party API credentials (`••••••••`) to prevent operator data leaks.
- Action audit logging in `AuditLog` table for every status transition, credit grant, and session revocation.

### Core Modules:
1. **Overview Dashboard**:
   - Total users, active workspaces, total conversations, platform GMV (৳), AI tokens consumed, actual provider costs (USD), platform AI revenue (৳).
   - Real-time Integration Health Matrix (Meta, WhatsApp, OpenAI, bKash, Nagad, SSLCommerz, Steadfast, Pathao).
2. **Workspace Governance**:
   - Search & filtering, 1-click status transitions (`ACTIVE`, `SUSPENDED`), and administrative credit injection.
3. **User Accounts Management**:
   - Verification status, role management, session revocation (`revokeUserSessions`).
4. **Transactions Ledger**:
   - Platform-wide payment records with gateway references.
5. **Global Pricing & Settings**:
   - Global trial credits, exchange rate reference, model multipliers, and maintenance mode.
6. **Audit Logs**:
   - Immutable security trail.

---

## 4. Test Verification Summary

- **Test Suite**: `apps/api/test/billing-and-admin.spec.ts` (16 assertions covering unit economics, atomic deductions, duplicate deduction prevention, low-balance alerts, top-up idempotency, refunds, admin adjustments, reconciliation, and SuperAdminGuard).
- **Monorepo Tests**: 8 suites, 79 total automated unit and integration tests passing 100%.
- **Frontend Verification**: Clean Next.js compilation with 33 static pages; visual verification captured in `billing_credit_wallet.png` and `super_admin_console.png`.
