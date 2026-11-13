# Phase 8-9: Business Automation Engine & External Integrations

This document specifies the technical architecture, execution semantics, and integration patterns for the **Automation Engine**, **Payment Gateway Adapters**, and **Courier Logistics Adapters** in OmniFlow SaaS.

---

## 1. Automation Workflow Engine

The Automation Engine enables multi-tenant event-driven workflows with condition filtering, sequential execution, branching, delay windows, and execution logging.

### Supported Triggers (`WorkflowTriggerType`)

| Trigger | Description | Trigger Context |
| :--- | :--- | :--- |
| `NEW_MESSAGE` | Incoming customer message across Facebook, WhatsApp, Instagram | `{ conversationId, customerId, message }` |
| `NEW_CUSTOMER` | New customer profile registered | `{ customerId, customer }` |
| `NEW_LEAD` | Customer qualifies or enters lead pipeline | `{ customerId, leadStage }` |
| `ORDER_CREATED` | New order placed | `{ orderId, orderNumber, totalAmount }` |
| `ORDER_STATUS_CHANGED` | Order transitions state (e.g. PROCESSING, CANCELLED) | `{ orderId, previousStatus, newStatus }` |
| `ORDER_SHIPPED` | Consignment booked with courier | `{ orderId, consignmentId, trackingCode }` |
| `ORDER_DELIVERED` | Parcel confirmed delivered | `{ orderId, trackingCode, deliveryDate }` |
| `PAYMENT_RECEIVED` | Payment verified via bKash, Nagad, SSLCommerz, or Stripe | `{ orderId, transactionId, amount, provider }` |
| `BOOKING_CREATED` | Customer books service appointment | `{ appointmentId, serviceId, scheduledStartTime }` |
| `INACTIVITY_TIMEOUT` | Customer stops replying for configurable duration | `{ conversationId, inactiveMinutes }` |
| `KEYWORD_DETECTED` | Customer message matches specific keywords | `{ keyword, messageText }` |
| `HUMAN_HANDOVER_REQUESTED` | Intent detection flags need for human agent | `{ conversationId, reason }` |

### Supported Actions (`WorkflowActionType`)

1. **`SEND_MESSAGE`**: Sends real-time message through connected channel.
2. **`ASSIGN_AGENT`**: Updates conversation/customer `assignedMemberId` to team member.
3. **`ADD_CUSTOMER_TAG`**: Ingests tag (e.g. `VIP`, `High-Priority`, `Repeat Customer`) to CRM profile.
4. **`CREATE_LEAD`**: Upserts lead stage (`QUALIFIED`, `PROPOSAL_SENT`, `WON`).
5. **`CREATE_ORDER_DRAFT`**: Creates draft order with preliminary item list.
6. **`SEND_NOTIFICATION`**: Logs high-priority alert in tenant audit log and customer timeline.
7. **`SCHEDULE_FOLLOWUP`**: Generates scheduled `FollowUp` task with due date.
8. **`ESCALATE_TO_HUMAN`**: Sets conversation status to `HUMAN_HANDOVER` and priority to `HIGH`.
9. **`WAIT_DELAY`**: Simulates/handles delayed window (e.g., 2 hours before abandoned cart nudge).

### Execution Auditing & Retry Management

Every workflow run creates a database record in `WorkflowExecution`:
- `id`: Unique execution identifier
- `tenantId`: Tenant data isolation filter
- `workflowId`: Associated workflow
- `status`: `SUCCESS` or `FAILED`
- `triggerEvent`: The originating trigger
- `contextData`: Full JSON snapshot of the event context
- `stepResults`: Array of step-by-step diagnostic execution logs
- `retryCount`: Incremented on re-run via `POST /api/v1/workflows/executions/:id/retry`
- `startedAt` & `completedAt`: Precise microsecond execution timestamps

---

## 2. Payment Gateway Adapters

OmniFlow provides server-side verified adapters with idempotent execution:

### 1. bKash Tokenized Checkout
- **Adapter**: `BkashClient` (`packages/integrations/src/payments/bkash.client.ts`)
- **API Flow**:
  1. `POST /create_payment` -> Returns `paymentID` and checkout redirect URL.
  2. `POST /execute_payment` -> Server-side verification returning `trxID` and verified amount.
  3. `POST /refund` -> Initiates transaction reversal for returns.
- **Idempotency**: Prevents double credit by checking existing `PaymentTransaction.transactionId`.

### 2. Nagad Remote Payment Gateway
- **Adapter**: `NagadClient` (`packages/integrations/src/payments/nagad.client.ts`)
- **API Flow**:
  1. `POST /initialize` -> Generates merchant payment reference with cryptographic signature.
  2. `GET /verify` -> Verifies issuer payment reference, amount, and order status.

### 3. SSLCommerz Aggregator
- **Adapter**: `SSLCommerzClient` (`packages/integrations/src/payments/sslcommerz.client.ts`)
- **API Flow**:
  1. `POST /gwprocess/v4/api.php` -> Session initiation returning `GatewayPageURL`.
  2. `POST /validator/api/validationserverAPI.php` -> Server-to-server IPN / transaction validation.
  3. `POST /validator/api/merchantTransIDvalidationAPI.php` -> Reversal/refund query.

---

## 3. Courier Logistics Integrations

### 1. Steadfast Courier Bangladesh
- **Adapter**: `SteadfastCourierClient` (`packages/integrations/src/couriers/steadfast.client.ts`)
- **Capabilities**:
  - `createOrder`: Dispatches parcel, generates `consignment_id` and tracking code.
  - `getDeliveryStatus`: Queries real-time parcel transit status (`in_transit`, `delivered`, `cancelled`).
  - `getBalance`: Live COD collection balance.

### 2. Pathao Merchant Courier
- **Adapter**: `PathaoCourierClient` (`packages/integrations/src/couriers/pathao.client.ts`)
- **Capabilities**:
  - `issue-token`: OAuth password grant authentication.
  - `createOrder`: Aladdin API order placement, zone/city routing, delivery fee estimation.
  - `getDeliveryStatus`: Live order info tracking.

### Delivery Status Synchronization
- **Method**: `CouriersService.syncDeliveryStatuses(tenantId)`
- **Behavior**: Scans all active shipments (`ACCEPTED`, `IN_TRANSIT`), polls live carrier tracking, updates `ShipmentStatus`, transitions `OrderStatus` (`DELIVERED` or `CANCELLED`), and appends a `CustomerTimelineEvent`.

---

## 4. Verification & Testing

- **Automated Tests**: `apps/api/test/automation-integrations.spec.ts` (10 assertions covering triggers, branching, payment verification, idempotency, Steadfast & Pathao dispatch, delivery status sync).
- **Monorepo Suite**: 7 passing suites, 63 total automated unit and integration tests.
- **Frontend Verification**: Visual Workflow Builder and Integrations Hub compiled and rendered at `http://localhost:3000/workflows` and `http://localhost:3000/integrations`.
