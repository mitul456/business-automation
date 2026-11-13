# OmniFlow — Authentication, Workspace Management & Multi-Tenant Isolation Architecture

This blueprint documents the end-to-end security architecture, session lifecycle, Role-Based Access Control (RBAC) hierarchy, multi-tenant database partitioning discipline, and isolation test guarantees for **OmniFlow SaaS**.

---

## 1. Authentication & Session Security Lifecycle

### 1.1 Dual-Token Architecture & Rotation
OmniFlow employs a hardened dual-token authentication scheme designed to prevent replay attacks, unauthorized session reuse, and stale permission elevation:

1. **Short-Lived Access Token (JWT)**:
   - **Lifespan**: 7 days (or configurable down to 15 minutes for enterprise tenants).
   - **Payload**:
     ```typescript
     export interface JwtPayload {
       sub: string;             // User ID (UUIDv4)
       email: string;           // Normalized lowercase email
       tenantId?: string;       // Active Workspace Tenant ID
       role?: WorkspaceRole;    // Role within the active workspace
       isSuperAdmin?: boolean;  // Platform super-admin flag
     }
     ```
   - **Signature**: HMAC SHA-256 with server-side `JWT_SECRET`.
   - **Verification**: Evaluated on every protected request by `JwtStrategy` and `JwtAuthGuard`.

2. **Long-Lived Refresh Token & Token Rotation**:
   - **Format**: High-entropy 32-byte cryptographic random hex string (`crypto.randomBytes(32)`).
   - **Storage**: Only the SHA-256 hash of the refresh token (`tokenHash`) is persisted in the database (`UserSession` model). Raw tokens are never stored at rest.
   - **Rotation**: When `/api/v1/auth/refresh-token` is invoked, the presented refresh token is immediately marked `revoked: true`, and a new refresh token + session record is issued.
   - **Lifespan**: 30 days of inactivity.

### 1.2 Session Tracking & Remote Revocation
The `UserSession` entity tracks active devices:
- `deviceInfo`: Parsed client User-Agent (browser/OS).
- `ipAddress`: Client IP address.
- `revoked`: Boolean flag. If set to `true`, all subsequent refresh requests fail immediately with `HTTP 401 Unauthorized`.
- **Global Session Revocation**: Triggered during password resets or when the user invokes `POST /api/v1/auth/revoke-sessions`.

---

## 2. Password Lifecycle & Email Verification

1. **Password Hashing**:
   - Salt generation: `bcrypt.genSalt(10)`.
   - Hash: `bcrypt.hash(password, salt)`.
   - Plaintext passwords are never logged, echoed, or cached.

2. **Email Verification**:
   - On registration, a 24-byte crypto token (`emailVerificationToken`) is generated with a 24-hour expiration window (`emailVerificationExpiresAt`).
   - Endpoint: `POST /api/v1/auth/verify-email` verifies the token, marks `emailVerified: true`, and clears the token.
   - Resend Endpoint: `POST /api/v1/auth/resend-verification` dispatches a fresh token.

3. **Forgot & Reset Password**:
   - Endpoint: `POST /api/v1/auth/forgot-password` generates a 1-hour reset token (`passwordResetToken`).
   - Endpoint: `POST /api/v1/auth/reset-password` validates the token against expiration, updates `passwordHash`, clears the reset token, and atomically revokes all existing `UserSession` records.

4. **Google OAuth**:
   - Endpoint: `POST /api/v1/auth/google`.
   - Automatically provisions new accounts with `emailVerified: true`, creates their initial workspace, grants 500 bonus AI credits, and links `googleId`.

---

## 3. Multi-Tenant Workspace Architecture

### 3.1 Workspace Model
Each business customer operates inside an isolated workspace represented by the `Tenant` entity:
- `id`: Globally unique UUIDv4.
- `name`: Display store name (e.g., "Apex Lifestyle").
- `slug`: Unique subpath identifier (e.g., `apex-lifestyle`).
- `category`: Domain vertical (`FASHION`, `ELECTRONICS`, `BEAUTY_COSMETICS`, `GROCERY_FOOD`, `HOME_LIVING`, `SERVICES`, `GENERAL_RETAIL`).
- `country`: Two-letter ISO country code (`BD`, `US`, `UK`, etc.).
- `currency`: Primary currency (`BDT`, `USD`, `EUR`, `GBP`).
- `timezone`: Localized timezone (`Asia/Dhaka`, `UTC`, `America/New_York`).
- `creditBalance`: Integer ledger balance for AI inference and automation executions.
- `businessSettings`: Dynamic JSON settings for order tax, invoice numbering, and courier rules.

### 3.2 Strict Data Partitioning Discipline
Cross-tenant contamination is prohibited through multi-layered defense:

```
[ Incoming HTTP Request ]
          │
          ▼
   [ JwtAuthGuard ] ──> Validates JWT signature & user status
          │
          ▼
   [ TenantGuard ]  ──> Extracts tenantId from JWT / x-tenant-id header
          │             Verifies active WorkspaceMember in DB
          ▼
   [ RolesGuard ]   ──> Verifies workspaceRole satisfies @Roles(...) hierarchy
          │
          ▼
 [ Scoped Controller & Prisma Service ]
          │
          ▼
   Prisma Query:
   where: {
     id: recordId,
     tenantId: req.tenantId  <── MANDATORY HARD PARTITION
   }
```

Every database query on tenant-owned records (orders, products, conversations, messages, channels, customers) must include `where: { tenantId }`.

---

## 4. Server-Side RBAC (Role-Based Access Control)

### 4.1 Role Hierarchy
OmniFlow supports 6 granular workspace roles with numeric privilege ranking:

| Hierarchy Rank | Role | Description |
| :---: | :--- | :--- |
| **5** | `OWNER` | Full administrative control, billing ownership, member role modifications, and workspace deletion. |
| **4** | `ADMIN` | Full operational control, member invitations, channel connections, AI prompt tuning, and product catalog. |
| **3** | `MANAGER` | Catalog management, customer CRM management, analytics access, and order approvals. |
| **2** | `SALES_AGENT` | Inbox messaging, product lookups, manual order placements, and customer tagging. |
| **2** | `SUPPORT_AGENT` | Inbox customer support, conversation resolution, and ticket handover. |
| **1** | `VIEWER` | Read-only visibility into dashboard KPIs, orders, and conversation transcripts. Cannot perform mutations. |

### 4.2 Permission Matrix

| Capability / Module | OWNER | ADMIN | MANAGER | SALES_AGENT | SUPPORT_AGENT | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Modify Workspace Profile & Currency | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Billing & Credit Top-ups | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Invite Workspace Members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Change Member Roles / Remove Members | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Connect Facebook / WhatsApp / Instagram | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configure AI Persona & System Prompts | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create / Edit Products & Inventory | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create & Confirm Orders | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Reply in Unified Inbox | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Dashboards & Order Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5. Guided Onboarding (8-Step Flow)

Accessible at `/onboarding`, the guided flow configures a production-ready store in under 2 minutes:

1. **Step 1: Account & Welcome**: Greets the user, highlights 500 bonus credits and multichannel support.
2. **Step 2: Business Profile**: Sets name, custom slug, country, currency (`BDT`, `USD`, `EUR`), and timezone (`Asia/Dhaka`).
3. **Step 3: Business Category**: Selects retail domain (`FASHION`, `ELECTRONICS`, `BEAUTY_COSMETICS`, etc.) to ground AI vocabularies.
4. **Step 4: Channel Connection**: Connects Facebook Page, Instagram Messaging, WhatsApp Business Cloud, and Web LiveChat.
5. **Step 5: Product Import**: Adds starter products or imports catalog CSV with live preview.
6. **Step 6: Business Knowledge Base**: Sets delivery fees (e.g. ৳60 Dhaka / ৳120 outside), return terms (7 days), and business hours.
7. **Step 7: AI Configuration**: Configures persona name, conversational tone (Friendly/Professional/Persuasive), language mode (Bengali/English/Auto), and human handover keywords.
8. **Step 8: AI Testing Simulator**: An interactive live simulation chat widget allows the merchant to test their AI with sample prompts (*"ডেলিভারি চার্জ কত?"*, *"How do I return a shirt?"*) before launching into the main dashboard.

---

## 6. Automated Tenant-Isolation Verification Suite

The tenant isolation guarantee is verified by automated integration tests in `apps/api/test/tenant-isolation.spec.ts`:

```
PASS test/orders.spec.ts
PASS test/auth.spec.ts
PASS test/tenant-isolation.spec.ts

Test Suites: 3 passed, 3 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        4.48 s
```

### Verified Isolation Scenarios:
1. **Read Isolation**: Verified that Tenant Alpha queries targeting a Tenant Beta order ID return `404 Not Found` and execute `findFirst({ where: { id, tenantId: 'tenant-alpha' } })`.
2. **List Partitioning**: Verified that listing orders filters strictly by `tenantId` and excludes other tenant records.
3. **Write Isolation**: Verified that attempts to mutate another workspace's order fail with `404 Not Found`.
4. **Destructive Isolation**: Verified that attempting to delete or remove a member belonging to another workspace fails with `404 Not Found`.
5. **Workspace Switching Guard**: Verified that User Alpha cannot switch to Tenant Beta without an existing `WorkspaceMember` record (throws `401 Unauthorized`).
6. **TenantGuard Validation**: Verified that unauthenticated requests or spoofed `x-tenant-id` headers are rejected with `403 Forbidden`.
7. **RBAC Hierarchy Enforcement**: Verified that `VIEWER` and `SUPPORT_AGENT` roles cannot invoke administrative or destructive operations.
