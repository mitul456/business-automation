# Engineering Rules & Coding Standards (`.agents/rules/engineering.md`)

This rule document governs all software engineering practices across the OmniFlow monorepo. Every engineer and AI agent must adhere to these standards.

---

## 1. TypeScript Strictness & Type Safety

1. **Strict Compiler Options**:
   - `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, and `noUncheckedIndexedAccess: true` must remain enabled across all tsconfigs.
2. **Zero `any` Policy**:
   - The `any` type is strictly forbidden.
   - Use explicit domain types, unions, generics, or `unknown` combined with type guards (`typeof`, `instanceof`, or Zod parsing).
   - In rare cases where external libraries lack types, create ambient module declarations (`.d.ts`).
3. **DTOs & Type Synchronization**:
   - Domain models and shared API contract types reside in `packages/shared`.
   - Backend NestJS DTOs must mirror or inherit from `packages/shared` schemas to prevent client-server drift.
4. **Enums & Const Assertions**:
   - Use TypeScript string enums or `as const` object maps for state machines, roles, channels, and statuses.

---

## 2. NestJS Backend Architecture (`apps/api`)

1. **Modular Domain Structure**:
   - Every domain (e.g., `inbox`, `orders`, `products`, `automation`, `ai`) must be encapsulated within its own module (`*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`).
   - Circular module dependencies are strictly prohibited. Use forward references (`forwardRef()`) only when unavoidable and documented.
2. **Request Validation**:
   - Every inbound request payload must be validated at the boundary using NestJS `ValidationPipe` with `class-validator` / `class-transformer` or Zod schemas.
   - Strip unknown properties: `whitelist: true`, `forbidNonWhitelisted: true`.
3. **Standard Response Envelope**:
   - All REST API endpoints must return the standardized response format:
     ```typescript
     interface ApiResponse<T> {
       success: boolean;
       data?: T;
       error?: {
         code: string;
         message: string;
         details?: unknown;
       };
       meta?: {
         page?: number;
         limit?: number;
         total?: number;
         hasMore?: boolean;
       };
     }
     ```
4. **Exception Handling**:
   - Throw NestJS built-in HTTP exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`, `ConflictException`).
   - Global `HttpExceptionFilter` intercepts uncaught errors, logs full details with correlation ID, and returns a safe sanitized payload to the client.

---

## 3. Next.js 15 App Router Architecture (`apps/web`)

1. **Server vs. Client Components**:
   - Default to **React Server Components (RSC)** for data fetching, static layout rendering, and initial page loads.
   - Use `'use client'` directive exclusively when client interactivity is required: event listeners, React hooks (`useState`, `useEffect`, `useReducer`), browser APIs, or WebSocket subscriptions.
2. **Data Fetching & State Management**:
   - RSCs fetch data directly via typed internal API clients or server-side service layers.
   - Client components interact with the API via `@tanstack/react-query` for caching, revalidation, and optimistic mutations.
3. **Design System & Tailwind CSS**:
   - Use semantic design tokens defined in `packages/ui` and `tailwind.config.ts`:
     - Surface: `bg-slate-50`, `bg-white`, `border-slate-200`
     - Typography: `text-slate-900`, `text-slate-600`, `text-slate-400`
     - Accent: `bg-indigo-600`, `hover:bg-indigo-700`, `text-indigo-600`
   - Mobile-first responsiveness is mandatory (`sm:`, `md:`, `lg:`, `xl:`).
4. **Internationalization (i18n)**:
   - All user-facing strings must support English (`en`) and Bengali (`bn`) using dictionary keys from `packages/shared/src/i18n`.
   - Never hardcode English strings directly into UI component JSX.

---

## 4. Prisma ORM & Database Discipline (`packages/database`)

1. **Multi-Tenant Scoping**:
   - Every query against tenant-scoped models (`Conversation`, `Message`, `Contact`, `Product`, `Order`, `Workflow`) must explicitly include `where: { tenantId }`.
   - Compound indexes must include `tenantId` as the leading column (e.g., `@@index([tenantId, status])`).
2. **Preventing N+1 Query Anti-Patterns**:
   - Use Prisma `include` or `select` joins to fetch related entities in a single round-trip.
   - Never iterate over arrays with nested `await prisma.entity.findUnique()`.
3. **Transactions for Consistency**:
   - Multi-table writes (e.g., creating an Order, deducting Product stock, and appending an AuditLog) must be wrapped in `prisma.$transaction()`.
4. **Vector Search Query Discipline**:
   - High-dimensional vector searches on `KnowledgeChunk.embedding` (`vector(1536)`) must be executed using parameterized raw queries:
     ```typescript
     await prisma.$queryRaw<Array<KnowledgeChunk & { similarity: number }>>`
       SELECT *, 1 - (embedding <=> ${vector}::vector) AS similarity
       FROM "KnowledgeChunk"
       WHERE "tenantId" = ${tenantId}
       ORDER BY embedding <=> ${vector}::vector
       LIMIT ${topK};
     `;
     ```
   - Never concatenate raw SQL strings without parameterization.

---

## 5. BullMQ & Background Processing (`apps/worker`)

1. **Job Idempotency**:
   - All background jobs must supply a deterministic `jobId` (e.g., `webhook:${provider}:${eventId}`) to prevent duplicate execution during network retries.
2. **Exponential Backoff & Concurrency**:
   - Configure BullMQ retry strategies:
     ```typescript
     attempts: 3,
     backoff: { type: 'exponential', delay: 2000 }
     ```
   - Bound queue concurrency based on memory and external rate limits (e.g., OpenAI concurrency capped at 10 concurrent requests).
3. **Dead Letter Queue (DLQ)**:
   - Failed jobs exceeding maximum retries must be recorded in the DLQ with error stack traces, payload snapshots, and timestamp for operator review.

---

## 6. Testing & Quality Standards

1. **Test Pyramid**:
   - **Unit Tests**: Test pure business logic, DTO validation, calculation algorithms (tax, discounts, credit balances), and utility functions.
   - **Integration Tests**: Test NestJS controllers, Prisma queries, and external adapter sandbox transformations.
   - **E2E Tests**: Use Playwright to test critical user flows: Auth, Inbox reply, Product creation, and Order checkout.
2. **Pre-Commit Verification**:
   - Run `pnpm run build` and `pnpm run test` before creating a pull request or completing an implementation milestone.
