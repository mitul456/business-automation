# OmniFlow — Business Operations Architecture (Phase 5)

This blueprint documents the architecture, database models, transaction safeguards, and REST API specifications for the complete business operations engine: **Product Catalog & Inventory**, **Customer CRM**, **Order Pipeline**, **Lead Kanban Management**, and **Booking Appointments**.

---

## 1. Product Catalog & Transaction-Safe Inventory Ledger

### 1.1 Data Schema & Multi-Variant Design
Products are strictly partitioned by `tenantId` and enforce SKU uniqueness at the database engine level via `@@unique([tenantId, sku])`:

- `Product`:
  - `id`: Unique UUIDv4.
  - `tenantId`: Foreign key to `Tenant` (hard tenant boundary).
  - `name`: Product title.
  - `sku`: SKU identifier.
  - `price`, `compareAtPrice`, `costPrice`: Decimal precision (`Decimal(12, 2)`).
  - `stockQuantity`: Integer current balance.
  - `lowStockThreshold`: Reorder alert threshold (default: 5).
  - `variants`: Dynamic JSON array containing `[{ size, color, sku, price, stockQuantity }]`.
  - `images`: JSON array of CDN image URLs.
  - `visualTags`: Array of visual search tags for AI multimodal photo matching.
  - `status`: `ACTIVE`, `DRAFT`, `OUT_OF_STOCK`, `ARCHIVED`.

### 1.2 Immutable Inventory Ledger (`InventoryTransaction`)
All stock movements are recorded in an append-only audit trail:
- `quantityDelta`: Signed integer (positive for restocks, negative for deductions).
- `balanceAfter`: Balance snapshot immediately following the movement.
- `type`: `RESTOCK`, `ORDER_DEDUCTION`, `ORDER_CANCEL_RESTORE`, `DAMAGE_LOSS`, `MANUAL_CORRECTION`.
- `referenceId`: Optional foreign ID (e.g. `orderId` or supplier batch number).
- `notes`: Audit reason.

**Stock Adjustment Endpoint**: `POST /api/v1/products/inventory/adjust`
Validates that adjustments cannot cause negative inventory balances (`newStock >= 0`).

### 1.3 CSV Import & Export
- **Import (`POST /api/v1/products/import/csv`)**: Parses CSV headers (`name, sku, price, compareAtPrice, stock, category`), runs Zod validation per row, and performs atomic database upserts.
- **Export (`GET /api/v1/products/export/csv`)**: Streams RFC-4180 compliant CSV of all catalog items.

---

## 2. Customer CRM & Interaction Timeline

### 2.1 Unified Customer Profile
- Contact info (`name`, `email`, `phone`, `avatarUrl`, `city`, `district`, `address`).
- Commercial metrics: `totalOrders` (integer count), `totalSpent` (`Decimal(12, 2)`).
- Qualitative data: `tags` (JSON array), `notes` (internal agent notes).
- Engagement metrics: `leadScore` (0-100 engagement score), `leadStage`.

### 2.2 Customer Activity Timeline (`CustomerTimelineEvent`)
Maintains an event stream of customer touchpoints:
- `ORDER_CREATED`: Logged when an order is submitted.
- `ORDER_STATUS_CHANGED`: Logged upon fulfillment or status shifts.
- `ORDER_CANCELLED`: Logged on cancellation with reason.
- `STAGE_CHANGED`: Logged when lead moves across Kanban columns.
- `NOTE_ADDED`: Logged when agents record internal remarks.
- `APPOINTMENT_BOOKED`: Logged when bookings are scheduled.

### 2.3 Segmentation Engine (`GET /api/v1/customers/segments`)
Groups contacts dynamically:
- **VIP Buyers**: Customers with `totalSpent >= 10,000 BDT` or `totalOrders >= 3`.
- **Returning Buyers**: Customers with `totalOrders >= 2`.
- **Active Leads**: Prospects with `totalOrders === 0`.
- Stage distribution counts across `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `WON`, `LOST`.

---

## 3. Order Management Pipeline & Idempotency

### 3.1 Order Lifecycle & Stock Safeguards
1. **Idempotency Guarantee**: Accepts `idempotencyKey`. If repeated, returns existing order record without duplicate creation or duplicate inventory deduction.
2. **Sequential Order Numbering**: Atomic sequential numbering per workspace (`ORD-YYYY-XXXX`).
3. **Transaction-Safe Stock Deduction**:
   ```typescript
   await tx.product.update({
     where: { id: item.productId },
     data: { stockQuantity: { decrement: item.quantity } }
   });
   await tx.inventoryTransaction.create({ ... });
   ```
4. **Order Cancellation & Stock Restoration (`POST /api/v1/orders/:id/cancel`)**:
   - Updates order status to `CANCELLED`.
   - Restores stock: `stockQuantity: { increment: item.quantity }`.
   - Logs `InventoryTransaction` of type `ORDER_CANCEL_RESTORE`.
   - Decrements customer `totalOrders` and `totalSpent`.
   - Records cancellation event in customer timeline.

### 3.2 Invoice Generation (`GET /api/v1/orders/:id/invoice`)
Generates comprehensive printable invoice JSON with store details, billed customer information, line item breakdown, delivery charges, discounts, and courier tracking details.

---

## 4. Lead Management & Kanban Pipeline

### 4.1 Kanban Stages
Organized across 6 standard sales pipeline stages:
1. `NEW`: Inbound customer inquiries from messaging channels.
2. `CONTACTED`: Agent or AI has engaged customer.
3. `QUALIFIED`: Customer has confirmed product interest and budget.
4. `PROPOSAL_SENT`: Formal quote, product card, or cart sent.
5. `WON`: Order confirmed and placed.
6. `LOST`: Inactive or customer declined.

### 4.2 Lead Scoring & Assignment
- **Lead Score**: `PATCH /api/v1/customers/:id/lead-score` updates engagement score (0-100).
- **Team Assignment**: `PATCH /api/v1/customers/:id/assign` assigns lead to team member.

### 4.3 Follow-up Reminders
- Entities: `FollowUp` (`title`, `dueDate`, `isCompleted`, `notes`, `assignedMemberId`).
- Endpoints: `POST /api/v1/customers/follow-ups`, `PATCH /api/v1/customers/follow-ups/:id`.

---

## 5. Booking Management & Collision Prevention

### 5.1 Service Catalog
- `BookingService`: Service title, duration in minutes (e.g. 30, 45, 60), price in BDT.
- Managed via `GET /api/v1/bookings/services`, `POST /api/v1/bookings/services`.

### 5.2 Collision Prevention Algorithm
When booking appointments (`POST /api/v1/bookings/appointments`), the service verifies slot availability to prevent double-booking:
```typescript
const overlap = await this.prisma.bookingAppointment.findFirst({
  where: {
    tenantId,
    serviceId: data.serviceId,
    status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
    AND: [
      { scheduledStartTime: { lt: endTime } },
      { scheduledEndTime: { gt: startTime } },
    ],
  },
});
if (overlap) throw new ConflictException('This time slot is already booked.');
```

### 5.3 Calendar & Table Views
- **List View**: Displays upcoming appointments with one-click Confirm/Cancel actions.
- **Calendar View (`GET /api/v1/bookings/appointments/calendar`)**: Aggregates month/year appointments with daily slot density.

---

## 6. Automated Testing Verification

All business operations modules are covered by automated unit and integration tests:

| Test Suite | Tests | Verification Focus | Status |
| :--- | :---: | :--- | :---: |
| `orders.spec.ts` | 3 | Idempotency, stock decrement, cancellation stock restore | **PASS** |
| `business-operations.spec.ts` | 7 | Duplicate SKU rejection, stock adjustments, negative stock block, CRM segmentation, timeline events, booking collision block | **PASS** |
| `tenant-isolation.spec.ts` | 10 | Cross-tenant read/write isolation, TenantGuard, RBAC | **PASS** |
| `auth.spec.ts` | 7 | Dual-token auth, session tracking, password reset | **PASS** |
| **Total** | **27** | Monorepo business logic verified | **PASS (100%)** |
