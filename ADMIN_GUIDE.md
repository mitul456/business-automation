# OmniFlow — Super-Administrator Operating Guide (`ADMIN_GUIDE.md`)

This guide outlines operating procedures, security controls, and management workflows for platform operators utilizing the **OmniFlow Super-Admin Console** (`/admin`).

---

## 1. Security Architecture & Access Boundaries

The Super-Admin interface operates with strict architectural separation from standard tenant workspaces:

- **RBAC Role Gate**: Access is restricted strictly to users with the `SUPER_ADMIN` system role (`User.isSuperAdmin = true` or `role = 'SUPER_ADMIN'`).
- **Zero Cross-Contamination**: Tenant workspace sessions cannot access `/admin/*` routes or `/api/v1/admin/*` endpoints. Attempts yield `403 Forbidden` and trigger security audit logs.
- **Audit Logging**: Every administrative action (credit grant, user suspension, settings mutation) is recorded immutably in the `AuditLog` table with timestamp, IP address, and operator ID.

---

## 2. Accessing the Super-Admin Console

1. Navigate to: `https://omniflow.app/admin`
2. Authenticate with designated Super-Admin credentials.
3. If two-factor authentication (2FA) is enforced, submit the TOTP code.

---

## 3. Platform Overview & System Telemetry

The **Admin Dashboard** displays real-time operational metrics across all workspaces:

### Key Metrics Tracked:
- **Total Workspaces**: Active, Onboarding, Suspended, and Trial workspaces.
- **Total Registered Users**: Owners, Admins, Support Agents, and Sales Agents.
- **Total Conversations & Messages**: Cross-channel throughput across Messenger, Instagram, and WhatsApp.
- **AI Infrastructure Usage**:
  - Total tokens consumed (Prompt + Completion).
  - Net provider cost (OpenAI billing) vs. Customer credit revenue.
  - Gross platform margin.
- **Live Infrastructure Health Status**:
  - `Database`: Connection pool status, active query latency.
  - `Redis & BullMQ`: Queue backlog, active jobs, failed job count.
  - `MinIO / S3`: Storage utilization and bucket availability.
  - `Meta & WhatsApp API`: Webhook delivery success rates.

---

## 4. Tenant & Workspace Management

Located under `/admin/workspaces`:

### Operations:
1. **Inspect Workspace**:
   - View business category, country, timezone, plan tier (`FREE_TRIAL`, `STARTER`, `GROWTH`, `ENTERPRISE`).
   - Monitor total customer contacts, catalog SKU counts, and monthly message volume.
2. **Suspend Workspace**:
   - Use-case: Non-payment, abuse, or spam violation.
   - Action: Toggling status to `SUSPENDED` immediately disconnects outbound message delivery, revokes API keys, and halts scheduled workflows.
3. **Change Plan Tier / Quotas**:
   - Manually adjust monthly message quotas, staff seat limits, or AI feature flags.

---

## 5. User Management & Security Controls

Located under `/admin/users`:

### Operations:
1. **Search Users**: Fast fuzzy lookup by email, name, or phone number.
2. **Emergency Session Revocation**:
   - Clicking **Revoke All Sessions** invalidates all active JWT refresh tokens and disconnects active WebSocket sessions immediately.
3. **Trigger Password Reset**:
   - Generates a cryptographically secure 1-hour password reset link and dispatches an email notification.
4. **Inspect User Audit Trail**:
   - Review recent logins, IP addresses, user agents, and authorization failures.

---

## 6. Credit Wallets & Financial Operations

Located under `/admin/credits`:

### Operations:
1. **Manual Credit Adjustments**:
   - In cases of customer support escalations or offline wire payments:
   - Enter `Workspace ID`, amount of credits (positive or negative), and mandatory audit note (e.g., `Offline bank wire transfer ref #10842`).
   - The platform creates an atomic, immutable ledger entry marked `ADMIN_ADJUSTMENT`.
2. **Payment Reconciliation**:
   - Inspect transaction status for bKash, Nagad, SSLCommerz, and Stripe payments.
   - If a customer was charged by bKash but network drops prevented the callback webhook, operators can manually trigger **Re-verify Transaction** to query the gateway directly and credit the wallet.

---

## 7. Global Platform Settings

Located under `/admin/settings`:

- **Default AI Model**: Switch the platform standard model between `gpt-4o` and `gpt-4o-mini`.
- **Credit Exchange Rate**: Configure credit conversion pricing (e.g., \$1 USD = 1,000 Credits).
- **Maintenance Banner**: Broadcast global announcements or scheduled maintenance warnings to all active dashboard users.
- **Log Retention Policy**: Configure automated purging of historical webhooks and transient execution logs.
