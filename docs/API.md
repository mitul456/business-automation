# OmniFlow AI — REST API & WebSocket Protocol Specification

## 1. Global API Standards

- **Base URL**: `https://api.omniflow.ai/api/v1` (Local dev: `http://localhost:4000/api/v1`)
- **Protocol**: HTTPS / WSS (TLS 1.3)
- **Standard Authentication**: Bearer JWT token passed via `Authorization: Bearer <jwt_token>`
- **Tenant Context Header**: `x-tenant-id: <workspace_uuid>` (Mandatory for all workspace-scoped requests)
- **Date Format**: ISO 8601 UTC string (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Standard Success Response**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": {
      "page": 1,
      "limit": 25,
      "total": 68,
      "totalPages": 3
    }
  }
  ```
- **Standard Error Response**:
  ```json
  {
    "success": false,
    "statusCode": 400,
    "error": "Validation failed: Phone number must be a valid Bangladeshi number (+8801...)",
    "timestamp": "2026-10-31T09:15:00.000Z",
    "path": "/api/v1/orders"
  }
  ```

---

## 2. Authentication & Identity Endpoints

### `POST /auth/register`
Creates user account, default workspace, starter subscription, provisions default AI persona, and grants 500 bonus AI credits.
- **Request Body**:
  ```json
  {
    "name": "Mitul Chowdhury",
    "email": "mitul@apexstore.com",
    "password": "Password123!",
    "workspaceName": "Apex Lifestyle & Tech"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "usr_98723",
        "name": "Mitul Chowdhury",
        "email": "mitul@apexstore.com",
        "isSuperAdmin": false
      },
      "tenant": {
        "id": "ten_10293",
        "name": "Apex Lifestyle & Tech",
        "slug": "apex-lifestyle-4891",
        "currency": "BDT",
        "creditBalance": 500,
        "role": "OWNER"
      }
    }
  }
  ```

### `POST /auth/login`
Validates user credentials and issues a signed JWT.
- **Request Body**:
  ```json
  {
    "email": "mitul@apexstore.com",
    "password": "Password123!"
  }
  ```

### `GET /auth/me`
Retrieves current authenticated profile and all accessible workspaces.
- **Headers**: `Authorization: Bearer <token>`

### `POST /auth/switch-workspace`
Issues a new JWT scoped to the requested workspace.
- **Request Body**: `{ "tenantId": "ten_10293" }`

---

## 3. Workspace & RBAC Endpoints

- `POST /workspaces`: Create new workspace (Owner only).
- `GET /workspaces/current`: View current workspace configuration, plan, and member counts.
- `GET /workspaces/current/members`: List team members and their active roles.
- `POST /workspaces/current/members`: Invite team member (`OWNER`, `ADMIN`, `MANAGER`, `AGENT`).
- `PATCH /workspaces/current/members/:id/role`: Update member role.
- `DELETE /workspaces/current/members/:id`: Revoke member access.

---

## 4. Omnichannel Ingress & Webhook Endpoints

### `GET /webhooks/meta`
Meta Webhook Verification endpoint.
- **Query Params**:
  - `hub.mode=subscribe`
  - `hub.verify_token=omniflow_webhook_verify_token_2026`
  - `hub.challenge=1158201444`
- **Response (200 OK)**: Returns the raw `hub.challenge` string.

### `POST /webhooks/meta`
Meta Event Delivery for Facebook Messenger and Instagram Direct.
- **Headers**: `x-hub-signature-256: sha256=<hmac>`
- **Response (200 OK)**: `{ "status": "EVENT_RECEIVED" }` (Enqueues job into `meta-webhook-queue`).

---

## 5. Omnichannel Unified Inbox Endpoints

### `GET /inbox/conversations`
Paginated conversation feed with channel, unread count, and status filters.
- **Query Parameters**:
  - `channelId`: Filter by connected channel UUID
  - `status`: `OPEN` | `BOT_ACTIVE` | `HUMAN_HANDOVER` | `SNOOZED` | `RESOLVED`
  - `search`: Filter by customer name, phone, or message preview
  - `page`: default 1
  - `limit`: default 25

### `GET /inbox/conversations/:id/messages`
Retrieves chronological message thread with sender metadata, media URLs, and sentiment.

### `POST /inbox/messages`
Sends manual human staff response or automated template.
- **Request Body**:
  ```json
  {
    "conversationId": "conv_98234",
    "content": "ওয়ালাইকুম আসসালাম! আপনার অর্ডারটি কনফার্ম করা হয়েছে।",
    "contentType": "TEXT",
    "mediaUrl": null
  }
  ```

### `POST /inbox/conversations/:id/takeover`
Human Handover Protocol: Pauses AI bot, assigns active staff member, and logs handover event.

### `POST /inbox/conversations/:id/return-to-ai`
Resumes automated AI reasoning and bot replies.

---

## 6. Multimodal AI Agent Endpoints

### `GET /ai-agent/config`
Retrieves persona name, tone, language, temperature, capabilities, and handover keywords.

### `PUT /ai-agent/config`
Updates agent parameters and prompt instructions.
- **Request Body**:
  ```json
  {
    "personaName": "Apex Assistant",
    "systemPrompt": "You are the AI sales assistant for Apex Lifestyle in Bangladesh...",
    "tone": "FRIENDLY",
    "language": "AUTO",
    "temperature": 0.7,
    "confidenceThreshold": 0.8,
    "capabilities": {
      "autoOrderCreation": true,
      "productSearch": true,
      "imageRecognition": true,
      "voiceTranscription": true,
      "bookingAppointment": true,
      "sentimentAnalysis": true
    },
    "handoverKeywords": ["human", "agent", "support", "প্রতিনিধি", "কথা বলতে চাই"],
    "fallbackMessageEn": "Connecting you to a human agent shortly.",
    "fallbackMessageBn": "আপনাকে কাস্টমার এজেন্টের সাথে যুক্ত করে দিচ্ছি।"
  }
  ```

### `POST /ai-agent/test-query`
Executes interactive test simulator query without impacting live customer threads.

---

## 7. Knowledge Base & RAG Endpoints

- `GET /knowledge/documents`: List indexed store documents and chunk statistics.
- `POST /knowledge/documents`: Upload FAQ, plain text, or scrape URL. Automatically chunks and embeds using `pgvector`.
- `DELETE /knowledge/documents/:id`: Remove document and cascade-delete its vector chunks.

---

## 8. Catalog, Products & Inventory Endpoints

- `GET /products`: Paginated list of products, variants, and stock counts.
- `POST /products`: Create product with SKU, price in BDT, stock quantity, and visual match tags.
- `PUT /products/:id`: Update stock count, price, or tags.
- `DELETE /products/:id`: Soft-delete or archive product.
- `GET /products/categories`: List category hierarchy.

---

## 9. Orders & Invoicing Endpoints

### `POST /orders`
Creates order with server-side idempotency protection.
- **Request Body**:
  ```json
  {
    "idempotencyKey": "idemp_98234_1730389200",
    "customerId": "cust_12934",
    "conversationId": "conv_98234",
    "channelId": "chan_48102",
    "items": [
      {
        "productId": "prod_1",
        "productName": "Royal Navy Blue Panjabi (42)",
        "unitPrice": 2850.00,
        "quantity": 1
      }
    ],
    "shippingCost": 60.00,
    "discount": 0.00,
    "paymentMethod": "COD",
    "shippingAddress": {
      "recipientName": "Tanvir Ahmed",
      "phone": "+8801712345678",
      "address": "House 42, Road 11, Sector 4, Uttara",
      "city": "Dhaka",
      "district": "Dhaka"
    }
  }
  ```

### `GET /orders/:id/invoice`
Generates structured invoice receipt data for on-demand printing or PDF generation.

### `PATCH /orders/:id/status`
Transitions order status: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`.

---

## 10. Courier Logistics Endpoints (Steadfast Courier)

### `POST /couriers/dispatch/steadfast/:orderId`
Dispatches order directly to Steadfast Courier portal.
- **Response (200 OK)**:
  ```json
  {
    "status": 200,
    "message": "Order created successfully",
    "consignment": {
      "consignment_id": 982341,
      "invoice": "ORD-2026-0001",
      "tracking_code": "ST-98765432",
      "recipient_name": "Tanvir Ahmed",
      "recipient_phone": "+8801712345678",
      "recipient_address": "House 42, Road 11, Sector 4, Uttara, Dhaka",
      "cod_amount": 2910.00,
      "status": "in_review"
    }
  }
  ```

### `GET /couriers/track/steadfast/:consignmentId`
Queries live delivery status.

### `GET /couriers/balance/steadfast`
Queries merchant portal available balance in BDT.

---

## 11. Payment Gateways Endpoints (bKash & Stripe)

### `POST /payments/bkash/create/:orderId`
Generates a tokenized checkout URL for bKash.
- **Response**: `{ "paymentID": "BKASH_PAY_...", "bkashURL": "https://tokenized.sandbox.bka.sh/..." }`

### `POST /payments/bkash/execute/:orderId`
Executes bKash payment verification upon return from customer PIN screen.

### `POST /payments/stripe/checkout/:orderId`
Creates Stripe Checkout Session for international card payments in USD.

---

## 12. WebSocket Real-Time Event Catalog

| Event Name | Direction | Payload Description |
|:---|:---:|:---|
| `join:conversation` | Client -> Server | Join conversation room (`conversationId`) |
| `leave:conversation` | Client -> Server | Leave conversation room |
| `message:new` | Server -> Client | New incoming customer message or outbound reply |
| `conversation:updated` | Server -> Client | Status change, unread count change, or handover notification |
| `inbox:message_received`| Server -> Client | Broadcast to tenant inbox room when background worker processes message |
