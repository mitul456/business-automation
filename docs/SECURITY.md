# OmniFlow AI — Security Architecture & Threat Model

## 1. Executive Security Posture
OmniFlow AI handles sensitive commercial operations: customer PII (phone numbers, addresses), financial transactions (bKash, Nagad, Stripe), and external API credentials (Meta Graph API tokens, WhatsApp System User tokens, Courier API secrets). Security is enforced by design across all architectural layers.

---

## 2. STRIDE Threat Model & Mitigations

| Threat Category | Potential Risk in OmniFlow AI | Architectural Mitigation |
|:---|:---|:---|
| **S - Spoofing** | Attacker spoofs Meta Webhook to inject fake customer messages or orders. | Strict cryptographic verification of `X-Hub-Signature-256` using `META_APP_SECRET`. Nonce and timestamp validation. |
| **S - Spoofing** | Attacker impersonates another workspace or user via forged JWT. | Asymmetric/strong secret JWT signing (`HS256` / `RS256`), short 15-minute token TTL, and cryptographic membership lookup via `TenantGuard`. |
| **T - Tampering** | Attacker alters product price or order quantity during chat order creation. | Server-side price authority: Prices are fetched directly from PostgreSQL `Product` table by `productId`. Client-provided unit prices are strictly ignored and recalculated server-side. |
| **R - Repudiation** | Merchant claims they did not dispatch an order or staff claims they didn't alter AI instructions. | Immutable `AuditLog` table capturing `userId`, `tenantId`, `action`, `entityType`, `ipAddress`, and `userAgent` on every protected mutation. |
| **I - Information Disclosure** | Tenant A accesses conversations, orders, or customer phone numbers of Tenant B (Cross-Tenant Data Leak). | Hard logical segregation: Every relational table enforces `tenantId` foreign key. NestJS `TenantGuard` and service layers mandate `where: { tenantId }` in every single database read and write. |
| **I - Information Disclosure** | Third-party access tokens or customer passwords leaked in application logs or stack traces. | Global `HttpExceptionFilter` and structured logger sanitize all sensitive keys: `accessToken`, `password`, `secretKey`, `apiKey`, `phone`, `cvv`. |
| **D - Denial of Service** | Attacker spams incoming messages to exhaust store AI credits or overwhelm backend. | Tiered rate limiting via Redis Throttler (`@nestjs/throttler`), BullMQ async ingestion decoupling, and strict pre-execution credit checks. |
| **E - Elevation of Privilege** | An `AGENT` user performs actions reserved for `OWNER` (e.g. invites members, connects payment gateways, views analytics). | Declarative `@Roles()` decorator + `RolesGuard` enforcing strict hierarchical role evaluation (`OWNER > ADMIN > MANAGER > AGENT`). |

---

## 3. Cryptographic Credential Protection (AES-256-GCM)

All external service credentials (Meta Access Tokens, WhatsApp Cloud Tokens, bKash App Secrets, Steadfast API Keys, Stripe Secrets) are encrypted at rest prior to persisting in the database:
- **Cipher**: `aes-256-gcm` (Authenticated Encryption with Associated Data)
- **Initialization Vector (IV)**: 16-byte cryptographically secure random bytes generated per field (`crypto.randomBytes(16)`)
- **Key Derivation**: 32-byte key derived via PBKDF2 / scrypt using dedicated environment salt (`ENCRYPTION_SECRET`)
- **Format**: `hex(iv):hex(authTag):hex(cipherText)`

```typescript
export class EncryptionService {
  static encrypt(plainText: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.getKey(), iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  static decrypt(cipherText: string): string {
    const [ivHex, tagHex, dataHex] = cipherText.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

---

## 4. Multi-Tenant Authorization Matrix (RBAC)

| Resource / Action | OWNER | ADMIN | MANAGER | AGENT |
|:---|:---:|:---:|:---:|:---:|
| View Inbox Conversations & Messages | ✅ | ✅ | ✅ | ✅ |
| Reply to Customer Messages | ✅ | ✅ | ✅ | ✅ |
| Execute Human Handover / Return to AI | ✅ | ✅ | ✅ | ✅ |
| Create Quick Order from Chat | ✅ | ✅ | ✅ | ✅ |
| View Product Catalog & Stock | ✅ | ✅ | ✅ | ✅ |
| Edit Product / Add Catalog Item | ✅ | ✅ | ✅ | ❌ |
| Dispatch Order to Courier (Steadfast) | ✅ | ✅ | ✅ | ❌ |
| Configure AI Agent Prompt & Tone | ✅ | ✅ | ❌ | ❌ |
| Connect / Disconnect Channels | ✅ | ✅ | ❌ | ❌ |
| View Store Analytics & GMV Reports | ✅ | ✅ | ❌ | ❌ |
| Manage Team Members & Roles | ✅ | ❌ | ❌ | ❌ |
| Purchase AI Credits & Manage Billing | ✅ | ❌ | ❌ | ❌ |

---

## 5. Webhook Security & Idempotency Architecture
1. **Verification**: Inbound Meta webhooks are immediately verified using `X-Hub-Signature-256` HMAC-SHA256 signature against the raw request buffer before JSON deserialization.
2. **Replay Protection**: Incoming message IDs (`mid` / `wamid`) are checked against existing `externalMessageId` records. Duplicate deliveries from Meta or network retries are dropped safely with `200 OK`.
3. **Financial Idempotency**: Order submissions require an `idempotencyKey`. If repeated within 24 hours with identical key, the cached order is returned without duplicating charges or decrementing inventory twice.
