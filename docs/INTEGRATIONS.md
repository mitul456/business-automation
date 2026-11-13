# OmniFlow AI — External Integrations & Official API Specifications

## 1. Integration Principles & Policy
OmniFlow AI adheres to strict engineering and commercial compliance rules:
1. **Official Documented APIs Only**: Integrations interact exclusively with verified, vendor-supported endpoints. No web scraping of walled gardens or private reverse-engineered APIs.
2. **Never Fake External API Success**: If an integration fails or external credentials are missing/invalid, report the error state accurately and mark the channel/gateway as `ERROR` or `DISCONNECTED`.
3. **Idempotent Operations**: All financial transactions and order dispatches require client-provided or system-generated unique idempotency tokens.
4. **Token Encryption at Rest**: Sensitive API keys, secrets, and bearer tokens are encrypted in PostgreSQL using AES-256-GCM.

---

## 2. Meta Graph API (Facebook Messenger & Instagram Direct)

### 2.1 Specification & Endpoints
- **API Version**: Graph API `v20.0`
- **Base URL**: `https://graph.facebook.com/v20.0`
- **Required Facebook App Permissions**:
  - `pages_show_list`: Enumerate merchant pages
  - `pages_read_engagement`: Monitor page interactions
  - `pages_messaging`: Send and receive customer messages via Messenger
  - `instagram_basic`: Read Instagram account profile
  - `instagram_manage_messages`: Access Instagram Direct conversations
- **Webhook Ingress Subscription Fields**:
  - `messages`: Inbound customer messages
  - `message_deliveries`: Delivery status tracking (`DELIVERED`)
  - `message_reads`: Read receipts (`READ`)
  - `messaging_postbacks`: User clicked persistent menu or quick reply buttons

### 2.2 Core Endpoints
1. **Send Message API**:
   - `POST https://graph.facebook.com/v20.0/me/messages?access_token={PAGE_ACCESS_TOKEN}`
   - **Payload**:
     ```json
     {
       "recipient": { "id": "<PSID>" },
       "message": { "text": "আপনার অর্ডারটি গ্রহণ করা হয়েছে!" },
       "messaging_type": "RESPONSE"
     }
     ```
2. **Send Generic Product Card Template**:
   - **Payload**:
     ```json
     {
       "recipient": { "id": "<PSID>" },
       "message": {
         "attachment": {
           "type": "template",
           "payload": {
             "template_type": "generic",
             "elements": [
               {
                 "title": "Royal Navy Blue Embroidered Panjabi",
                 "subtitle": "Price: 2,850 BDT | Stock: 45 Available",
                 "image_url": "https://storage.omniflow.ai/products/panjabi.jpg",
                 "buttons": [
                   { "type": "postback", "title": "Buy with COD", "payload": "BUY_COD_PJ-ROYAL-NAVY-M" },
                   { "type": "web_url", "title": "Pay with bKash", "url": "https://pay.omniflow.ai/bkash/ord_123" }
                 ]
               }
             ]
           }
         }
       }
     }
     ```
3. **Webhook Cryptographic Signature Verification**:
   - Header: `X-Hub-Signature-256: sha256=<HMAC_HEX>`
   - Secret: `META_APP_SECRET`
   - Verification Algorithm:
     ```typescript
     const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
     crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
     ```

---

## 3. WhatsApp Business Cloud API

### 3.1 Specification & Endpoints
- **Provider**: Meta WhatsApp Cloud API
- **Base URL**: `https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages`
- **Authentication**: System User Permanent Access Token (`Bearer {SYSTEM_USER_ACCESS_TOKEN}`)
- **24-Hour Policy**: Free-form AI responses are permitted within 24 hours of customer's last message. Outside the 24-hour window, pre-approved Message Templates must be used.

### 3.2 Core Endpoints
1. **Send Text Message**:
   - **Payload**:
     ```json
     {
       "messaging_product": "whatsapp",
       "recipient_type": "individual",
       "to": "8801712345678",
       "type": "text",
       "text": { "body": "আসসালামু আলাইকুম! Apex Lifestyle-এ স্বাগতম।" }
     }
     ```
2. **Send Interactive Reply Buttons**:
   - **Payload**:
     ```json
     {
       "messaging_product": "whatsapp",
       "recipient_type": "individual",
       "to": "8801712345678",
       "type": "interactive",
       "interactive": {
         "type": "button",
         "body": { "text": "আপনি কি ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করতে চান?" },
         "action": {
           "buttons": [
             { "type": "reply", "reply": { "id": "btn_confirm_cod", "title": "হ্যাঁ, অর্ডার করবো" } },
             { "type": "reply", "reply": { "id": "btn_speak_human", "title": "প্রতিনিধি প্রয়োজন" } }
           ]
         }
       }
     }
     ```

---

## 4. OpenAI API (Multimodal Intelligence Engine)

### 4.1 Models & Tasks
- **Conversational Sales & Reasoning**: `gpt-4o` (or configurable model identifier)
- **Visual Product Recognition**: `gpt-4o` Vision capabilities
- **Voice Message Transcription**: `whisper-1`
- **RAG Vector Embeddings**: `text-embedding-3-small` (1536 dimensions)

### 4.2 Whisper Speech-to-Text Ingestion
- When customer submits a voice clip (.ogg / .m4a / .mp3), worker fetches audio stream:
  ```typescript
  const formData = new FormData();
  formData.append('file', audioBuffer, { filename: 'voice.ogg' });
  formData.append('model', 'whisper-1');
  const res = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, ...formData.getHeaders() }
  });
  ```

---

## 5. bKash Tokenized Checkout API (Bangladesh)

### 5.1 Architecture & Endpoints
- **API Version**: `v1.2.0-beta`
- **Sandbox URL**: `https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout`
- **Live URL**: `https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout`

### 5.2 Payment Flow
1. **Grant Token (`POST /token/grant`)**:
   - Request: `{ "app_key": "...", "app_secret": "..." }` with Basic Auth credentials (`username`, `password`).
   - Response: `{ "id_token": "...", "expires_in": 3600 }`.
2. **Create Payment (`POST /create`)**:
   - Request:
     ```json
     {
       "mode": "0011",
       "payerReference": "01712345678",
       "callbackURL": "https://api.omniflow.ai/api/v1/payments/bkash/callback",
       "amount": "2910.00",
       "currency": "BDT",
       "intent": "sale",
       "merchantInvoiceNumber": "ORD-2026-0001"
     }
     ```
   - Response: Returns `paymentID` and customer redirect `bkashURL`.
3. **Execute Payment (`POST /execute`)**:
   - Request: `{ "paymentID": "<paymentID>" }`.
   - Response: `{ "trxID": "BKA98234", "transactionStatus": "Completed", "amount": "2910.00" }`.

---

## 6. Steadfast Courier Logistics API (Bangladesh)

### 6.1 Architecture & Endpoints
- **Base URL**: `https://portal.steadfast.com.bd/api/v1`
- **Headers**:
  - `Api-Key: {STEADFAST_API_KEY}`
  - `Secret-Key: {STEADFAST_SECRET_KEY}`
  - `Content-Type: application/json`

### 6.2 Core Endpoints
1. **Create Delivery Consignment (`POST /create_order`)**:
   - **Request**:
     ```json
     {
       "invoice": "ORD-2026-0001",
       "recipient_name": "Tanvir Ahmed",
       "recipient_phone": "+8801712345678",
       "recipient_address": "House 42, Road 11, Sector 4, Uttara, Dhaka",
       "cod_amount": 2910,
       "note": "Fragile merchandise"
     }
     ```
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
         "cod_amount": 2910,
         "status": "in_review"
       }
     }
     ```
2. **Track Status (`GET /status_by_cid/{consignment_id}`)**:
   - Returns live courier lifecycle: `in_review`, `delivered`, `cancelled`, `in_transit`.
3. **Get Available Balance (`GET /get_balance`)**:
   - Returns merchant COD balance collected and available for payout.
