# OmniFlow AI — Automated Testing & Quality Assurance Strategy

## 1. Testing Philosophy & Quality Gates
To deliver a commercial-grade, production-reliable SaaS platform, automated testing is mandatory for all critical business operations:
- **Never Deploy Untested Changes**: All pull requests must pass automated linting, type-checking, unit tests, and integration tests before deployment.
- **Test Real Workflows**: Test multi-tenant isolation, order calculations in BDT, idempotency guarantees, and webhook cryptographic validation.
- **Safe External API Mocking**: Mock third-party APIs (Meta, bKash, Steadfast, OpenAI) cleanly during tests to prevent external dependency flakiness and unintended charges.

---

## 2. Test Pyramid & Coverage Targets

```mermaid
pie title Automated Test Distribution
    "Unit Tests (Jest)": 60
    "Integration Tests (Supertest + DB)": 25
    "End-to-End Tests (Playwright)": 15
```

### Coverage Targets
- **Core Domain Logic (Shared Packages)**: 90%+ branch coverage
- **API Controllers & Services (`apps/api`)**: 80%+ line coverage
- **Critical Business Flows (Auth, Orders, Payments, Couriers)**: 100% test coverage

---

## 3. Test Suites & Categorization

### 3.1 Unit Testing (Jest)
- **Encryption Service**: Verify AES-256-GCM encryption produces unique ciphertexts with random IVs and cleanly decrypts back to plaintext.
- **Idempotency Protection**: Verify repeated order placement with identical `idempotencyKey` returns the cached order without duplicate inventory decrement or double charges.
- **Order Calculation Engine**: Verify subtotal, discount, shipping fee (Inside Dhaka ৳60 / Outside Dhaka ৳120), and total amounts in BDT.
- **DTO & Zod Validation**: Verify invalid phone numbers, malformed emails, or negative prices are rejected with descriptive 400 Bad Request errors.

### 3.2 Integration Testing (NestJS + Supertest)
- **Multi-Tenant Guard Tests**:
  - Request with valid JWT of Tenant A attempting to access Tenant B resource -> Assert `403 Forbidden`.
  - Request with missing `x-tenant-id` header -> Assert `400 Bad Request`.
  - Super Admin accessing `/api/v1/super-admin/tenants` -> Assert `200 OK`.
- **Meta Webhook Ingress Tests**:
  - Valid `X-Hub-Signature-256` payload -> Assert `200 OK` and job enqueued in Redis BullMQ.
  - Invalid signature payload -> Assert `403 Forbidden`.
- **Payment Verification Tests**:
  - Simulated bKash execution callback -> Assert order marked as `PAID` and `PaymentTransaction` record created.

### 3.3 End-to-End (E2E) Browser Testing (Playwright)
- **Journey 1: Merchant Onboarding & Workspace Provisioning**:
  - Navigate to `/register` -> Fill details -> Verify redirect to `/dashboard` -> Verify 500 bonus credits displayed.
- **Journey 2: Omnichannel Chat to Quick Order**:
  - Navigate to `/dashboard/inbox` -> View conversation -> Send human message -> Click "Quick Order" -> Confirm COD -> Verify order card rendered in chat.
- **Journey 3: Courier Parcel Booking**:
  - Navigate to `/dashboard/orders` -> Click "Dispatch" on confirmed order -> Confirm Steadfast modal -> Verify consignment tracking code generated (`ST-XXXXXXXX`).

---

## 4. Continuous Integration (CI/CD Pipeline)

GitHub Actions workflow definition (`.github/workflows/ci.yml`):
```yaml
name: OmniFlow CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_DB: omniflow_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 12.16.1
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Type Check & Lint
        run: pnpm -r run lint && pnpm -r exec tsc --noEmit

      - name: Run Database Migrations
        run: pnpm --filter @omniflow/database db:push
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/omniflow_test

      - name: Run Unit & Integration Tests
        run: pnpm test

      - name: Build All Monorepo Projects
        run: pnpm build
```
