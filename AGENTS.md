# OmniFlow SaaS — Autonomous Engineering Agent Charter (`AGENTS.md`)

This document defines the operational directives, architectural constraints, and standard operating procedures (SOPs) for all autonomous AI agents and automated engineering workflows working within the **OmniFlow** SaaS codebase.

---

## 1. Project Charter & Mission

**OmniFlow** is a commercial-grade, multi-tenant AI Business Automation SaaS platform inspired by the core operational capabilities of AiPraktor. The platform enables businesses in Bangladesh and globally to:
- Connect omnichannel messaging platforms (**Facebook Messenger**, **Instagram Messaging**, and **WhatsApp Business Cloud API**).
- Manage all customer interactions via a unified, real-time shared collaborative team inbox.
- Deploy autonomous AI agents capable of 24/7 conversational customer support, intent-driven sales qualification, visual product recognition from customer images, and voice message audio transcription.
- Manage full-lifecycle product catalogs, real-time inventory balances, and automated multi-channel orders.
- Integrate regional and international payment gateways (**bKash**, **Nagad**, **Stripe**) and courier logistics (**Steadfast Courier**, **Pathao**, **RedX**).
- Track usage and automate monetization via a credit-based billing ledger.

---

## 2. Monorepo Topology & Boundaries

The codebase is organized as a unified `pnpm` monorepo. Agents must respect boundary boundaries and maintain strict separation of concerns:

```
├── apps/
│   ├── web/               # Next.js 15 (App Router), React 19, Tailwind CSS, TanStack Query
│   ├── api/               # NestJS 10, Fastify/Express, REST API, WebSockets (Socket.IO)
│   └── worker/            # BullMQ background worker engine, async queue processors
├── packages/
│   ├── database/          # Prisma ORM, PostgreSQL 16 + pgvector schema, migrations, seeders
│   ├── shared/            # TypeScript interfaces, enums, Zod DTO schemas, i18n dictionaries
│   ├── ui/                # Reusable design system UI components (Tailwind CSS + Lucide)
│   └── integrations/      # Official third-party API adapters (Meta, OpenAI, bKash, Steadfast)
└── docs/                  # System architecture, database, API, and security blueprints
```

### Dependency Rules:
1. `packages/shared` has zero internal workspace dependencies and can be imported anywhere.
2. `packages/database` exports Prisma Client and repository helpers; `apps/api` and `apps/worker` depend on it. `apps/web` must NEVER import `packages/database` directly.
3. `packages/integrations` encapsulates all third-party network calls, webhook signature verifiers, and client SDKs.
4. `packages/ui` contains presentational components; it must not contain backend or database logic.

---

## 3. Non-Negotiable Engineering Principles

All AI agents contributing to this codebase are bound by the following non-negotiable principles:

1. **Real, Functional Software**:
   - Never commit fake mocks or static placeholder code as finished features.
   - If an external credential is not yet provided by the user, implement the real adapter, sandbox mode, configuration UI, and clear "Not Connected" states.
2. **TypeScript Strictness**:
   - `strict: true` is enforced across all `tsconfig.json` configurations.
   - Zero `any` types. Use explicit types, generics, or `unknown` with runtime type narrowing.
3. **Multi-Tenant Data Isolation**:
   - Every protected database query must filter by `tenantId`.
   - Never rely exclusively on client-provided IDs; verify tenant ownership in server-side guards and Prisma queries.
4. **Server-Side Authorization & RBAC**:
   - Enforce server-side authorization guards on all protected REST endpoints and WebSocket events.
   - Validate roles (`OWNER`, `ADMIN`, `MANAGER`, `AGENT`) using `@Roles()` decorators.
5. **PostgreSQL 16 + `pgvector` Schema Discipline**:
   - All relational entities, foreign keys, cascades, and indexes are defined in `packages/database/prisma/schema.prisma`.
   - Never run raw schema modifications without version-controlled migrations.
6. **Background Queues via BullMQ & Redis**:
   - Inbound webhooks (Meta, WhatsApp, Stripe, Courier) must respond with `HTTP 200` immediately (< 5s) and delegate payload ingestion to BullMQ queues.
   - AI generation, audio transcription, image analysis, and notification dispatches must run asynchronously in `apps/worker`.
7. **Idempotency**:
   - Every financial transaction, credit deduction, and order placement must support idempotent execution via an `Idempotency-Key` header and database record.
8. **Zero Production Secrets**:
   - Never commit secrets, tokens, API keys, or private keys to version control.
   - All credentials stored in the database must be encrypted using AES-256-GCM via `packages/integrations`.

---

## 4. Agent Operational Workflow

When given a coding or architectural task, agents must follow this 4-step workflow:

### Step 1: Pre-Implementation Analysis
- Inspect relevant blueprint documents in `docs/` (`ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `INTEGRATIONS.md`, `SECURITY.md`, `TESTING.md`).
- Verify existing package code and database schemas before authoring new entities.
- Identify external API dependencies and verify compliance with official specifications.

### Step 2: Incremental Implementation
- Author shared TypeScript types and Zod schemas in `packages/shared`.
- Update Prisma schema and generate migrations if database changes are required.
- Implement backend service logic, controllers, and validation DTOs in `apps/api`.
- Implement background queue processors in `apps/worker` for async tasks.
- Implement frontend interfaces, hooks, and responsive components in `apps/web`.

### Step 3: Verification & Quality Gates
Before reporting task completion, agents must run and verify:
```bash
# Typecheck across the entire monorepo
pnpm run build

# Run automated tests
pnpm run test

# Run linter
pnpm run lint
```
- For UI features: Verify responsiveness, dark/light contrast, Bengali/English i18n support, and browser rendering.

### Step 4: Documentation & Reporting
- Maintain documentation integrity: Never overwrite unrelated comments or docstrings.
- Update `docs/IMPLEMENTATION_PLAN.md` progress markers.
- Clearly report modified files, test results, and any pending external API credentials.

---

## 5. Standard Project Commands

Agents must use the following standard commands:

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Install Dependencies** | `pnpm install` | Install workspace dependencies |
| **Build All Packages** | `pnpm run build` | Compile shared packages, Next.js, NestJS, and Worker |
| **Run Linter** | `pnpm run lint` | ESLint across all workspaces |
| **Run Unit Tests** | `pnpm run test` | Execute Jest unit test suites |
| **Prisma Generate** | `pnpm --filter @omniflow/database prisma generate` | Regenerate Prisma client |
| **Prisma Migrate (Dev)**| `pnpm --filter @omniflow/database prisma migrate dev` | Apply migrations locally |
| **Prisma Studio** | `pnpm --filter @omniflow/database prisma studio` | Inspect database visualizer |
| **Dev API Server** | `pnpm --filter @omniflow/api start:dev` | Start NestJS development server |
| **Dev Web Client** | `pnpm --filter @omniflow/web dev` | Start Next.js development server |
| **Dev Worker** | `pnpm --filter @omniflow/worker start:dev` | Start BullMQ worker process |

---

## 6. Prohibited Practices

Agents must NEVER:
1. Bypass or disable multi-tenant isolation filters (`where: { tenantId }`).
2. Log raw access tokens, authorization headers, passwords, or customer PII.
3. Fake or stub third-party API successes without documenting sandbox behavior.
4. Execute raw destructive database operations (`DROP TABLE`, `prisma migrate reset --force`) without explicit human confirmation.
5. Introduce unvetted third-party npm packages when existing standard packages or native platform capabilities suffice.
6. Commit placeholder routes with unhandled `500` errors.

---

## 7. Escalation & Human Approval Gates

The following actions require explicit human operator confirmation before execution:
1. Modifying database schema columns with non-backward-compatible changes (dropping columns, changing enum values in production).
2. Binding or configuring real third-party production credentials (Meta App Secret, WhatsApp System User Token, bKash Merchant Key, Stripe Live Key).
3. Executing live financial payouts or live courier booking dispatches.
4. Provisioning or altering production cloud infrastructure.
