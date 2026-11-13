# Security Rules & Guardrails (`.agents/rules/security.md`)

This rule document defines the mandatory security policies, threat prevention protocols, and data protection guardrails that must be strictly enforced by all engineers and autonomous agents across the OmniFlow codebase.

---

## 1. Multi-Tenant Data Isolation & IDOR Prevention

1. **Mandatory Tenant Scoping in Prisma Queries**:
   - Every read, update, and delete query on workspace-scoped entities must include `where: { tenantId }`.
   - Never query solely by entity ID (e.g., `where: { id }` alone is strictly prohibited for tenant-owned tables).
   - Use composite criteria:
     ```typescript
     // CORRECT:
     await prisma.order.findUnique({
       where: { id_tenantId: { id, tenantId } },
     });

     // FORBIDDEN:
     await prisma.order.findUnique({
       where: { id },
     });
     ```
2. **Server-Side Context Enforcement**:
   - Extract `tenantId` exclusively from authenticated session credentials (`req.user.tenantId` via `JwtAuthGuard`), NEVER from untrusted client request bodies or query params.
3. **Workspace Switch Verification**:
   - When a user switches active workspace, verify that an active `UserWorkspace` membership record exists with a valid role before issuing a new workspace session token.

---

## 2. Secrets & Credential Encryption at Rest

1. **Zero Plaintext Credentials in Storage**:
   - All third-party credentials (Meta Access Tokens, WhatsApp Cloud Tokens, OpenAI API Keys, bKash App Secrets, Stripe Secret Keys, Steadfast Courier API Keys) must be encrypted prior to database insertion.
2. **Encryption Standard**:
   - Encrypt using **AES-256-GCM** with a distinct 12-byte initialization vector (IV) and 16-byte authentication tag per record.
   - The primary master encryption key `ENCRYPTION_MASTER_KEY` (32 bytes hex) is supplied via environment variables and must never be committed to git.
   - Use the centralized `EncryptionService` from `packages/integrations/src/crypto/encryption.service.ts`.
3. **Zero Secrets in Code**:
   - Hardcoded API keys, test passwords, and mock tokens in source files are grounds for immediate rejection during quality gates.

---

## 3. Webhook Authentication & Replay Protection

1. **Raw Body Signature Verification**:
   - Inbound webhooks from **Meta Graph API**, **WhatsApp Cloud API**, and **Stripe** must verify their cryptographic signatures against the raw unparsed request buffer before JSON deserialization.
   - Meta/WhatsApp: Compute HMAC-SHA256 using the tenant's app secret over `rawBody` and compare using `crypto.timingSafeEqual` against the `X-Hub-Signature-256` header.
   - Stripe: Verify with official SDK `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`.
2. **Replay Attack Mitigation**:
   - Webhook events must be checked against a 5-minute timestamp tolerance window.
   - Deduplicate inbound webhook event IDs in Redis (`SETNX webhook:processed:<id> 1 EX 86400`).

---

## 4. Authentication, Authorization & Session Management

1. **Password Hashing**:
   - Passwords must be hashed using `bcrypt` with a minimum cost factor of 12 salt rounds (or Argon2id).
   - Plaintext passwords must never be stored, logged, or returned in API responses.
2. **Token Security**:
   - Access tokens: Short-lived (15 minutes), signed with `JWT_SECRET` (minimum 256-bit entropy).
   - Refresh tokens: Long-lived (7 days), hashed before storage in the database, with automatic token rotation on reuse detection.
3. **Role-Based Access Control (RBAC)**:
   - Endpoints must be protected by `@UseGuards(JwtAuthGuard, RolesGuard)`.
   - Role permissions:
     - `OWNER`: Full tenant administrative, billing, team, and destructive permissions.
     - `ADMIN`: Tenant management, integrations, products, workflows, and catalog operations.
     - `MANAGER`: Inbox supervisor, order management, team assignments, and analytics.
     - `AGENT`: Direct inbox conversation handling, message replies, and customer CRM viewing.
4. **Super-Admin Protection**:
   - Super-admin platform endpoints (`/api/v1/admin/*`) require dedicated `isSuperAdmin: true` claims on the root user account.

---

## 5. Input Validation, Sanitization & Injection Defense

1. **Strict Server-Side Validation**:
   - All REST DTOs and WebSocket messages must be validated using `class-validator` or Zod.
   - Whitelist validation must strip extraneous properties to prevent mass-assignment vulnerabilities.
2. **SQL Injection Defense**:
   - All relational database interactions must use Prisma ORM's parameterized query builder.
   - For `pgvector` similarity queries, use `prisma.$queryRaw` with template literal parameter binding; raw string concatenation is strictly prohibited.
3. **Cross-Site Scripting (XSS)**:
   - Inbound rich text, customer messages, and note inputs must be sanitized using `sanitize-html` or `dompurify` before storage and rendering.
4. **Rate Limiting**:
   - Public and authentication endpoints must be rate-limited using `@nestjs/throttler` backed by Redis:
     - `/api/v1/auth/login`: Maximum 5 attempts per IP per 5 minutes.
     - Public webhooks: Maximum 500 requests per minute per IP.
     - General API routes: Maximum 100 requests per minute per authenticated user.

---

## 6. AI Guardrails & Prompt Injection Defense

1. **System Prompt Hardening**:
   - System prompts must delineate user messages and retrieved knowledge base context using unambiguous delimiters (e.g., `<customer_message>`, `<retrieved_context>`).
   - Explicit instructions must command the model to ignore any instructions within customer inputs that attempt to override system rules, leak instructions, or fabricate unauthorized discounts.
2. **Action Validation Gate**:
   - The AI agent cannot directly finalize irreversible actions (such as charging a credit card or confirming a free order).
   - Actions proposed by the AI (e.g., drafting an order) must be structured as actionable proposals subject to system validation or human agent approval.
3. **Confidence Scoring & Human Handover**:
   - If AI intent confidence drops below 0.70 or customer explicitly requests human support, the conversation must automatically trigger `handoverToHuman()` and notify team agents.

---

## 7. Logging, Monitoring & Audit Trails

1. **PII & Credential Scrubbing**:
   - Never log authorization headers, passwords, credit card numbers, national IDs, or customer phone numbers.
   - Use structured logging (e.g., Pino) with automatic field redaction filters:
     ```typescript
     redact: ['req.headers.authorization', 'body.password', 'body.apiKey', 'body.secret']
     ```
2. **Audit Trails**:
   - Write immutable audit log entries (`AuditLog`) for all sensitive operations:
     - Authentication events (login, logout, failed attempts, password resets).
     - Membership changes (invite user, change role, remove member).
     - Integration credential updates (connect page, update bKash credentials).
     - Order adjustments, manual refunds, and credit ledger adjustments.
