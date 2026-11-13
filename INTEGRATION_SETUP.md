# OmniFlow — Third-Party Integration Setup Manual (`INTEGRATION_SETUP.md`)

This guide provides step-by-step instructions for provisioning, configuring, and verifying all third-party external provider integrations in **OmniFlow SaaS**.

---

## 1. Meta Developer App (Facebook Messenger & Instagram Direct)

OmniFlow connects directly to Meta's Graph API v19.0+ for omnichannel Facebook Page and Instagram Professional conversation management.

### Step 1: Create Meta Developer App
1. Go to the [Meta for Developers Portal](https://developers.facebook.com/).
2. Click **My Apps** > **Create App**.
3. Select **Business** as the app use-case type.
4. Set Display Name (e.g., `OmniFlow Automation`) and associate with your verified Meta Business Account.

### Step 2: Add Messenger & Instagram Products
1. Under **Add products to your app**, find **Messenger** and click **Set up**.
2. Under **Add products to your app**, find **Instagram** and click **Set up**.

### Step 3: Required Permissions & App Review
For production multi-tenant OAuth, your Meta App must request and pass App Review for:
- `pages_show_list`: Allows discovering Facebook pages managed by the user.
- `pages_messaging`: Grants ability to receive and send messages on behalf of a Page.
- `pages_manage_metadata`: Subscribes pages to OmniFlow webhooks.
- `instagram_basic`: Accesses Instagram Professional account info.
- `instagram_manage_messages`: Ingests and responds to Instagram Direct DMs.

### Step 4: Configure Webhooks
1. In Meta App Dashboard, navigate to **Webhooks** > **Page**.
2. Set **Callback URL** to: `https://your-domain.com/api/v1/webhooks/meta`
3. Set **Verify Token** to the value of `META_WEBHOOK_VERIFY_TOKEN` configured in your `.env`.
4. Subscribe to the following page events:
   - `messages`
   - `messaging_postbacks`
   - `message_deliveries`
   - `message_reads`
5. Repeat for **Instagram** webhooks (`messages`, `messaging_seen`).

---

## 2. WhatsApp Business Cloud API (WABA)

OmniFlow utilizes the official Meta Cloud API for WhatsApp messaging without requiring an on-premise WhatsApp server.

### Step 1: Create System User & Permanent Token
1. Open [Meta Business Suite](https://business.facebook.com/) > **Business Settings**.
2. Navigate to **Users** > **System Users**.
3. Click **Add**, name the user (e.g., `OmniFlow-System`), and assign the **Admin** role.
4. Click **Generate New Token**, select your app, set token expiration to **Never**, and grant:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
5. Save this token securely as `WHATSAPP_ACCESS_TOKEN`.

### Step 2: Register Phone Number
1. Under **Accounts** > **WhatsApp Accounts**, select your WABA.
2. Under **Phone Numbers**, add your business number.
3. Complete SMS or voice OTP verification.
4. Copy the **Phone Number ID** (a 15-digit integer) to `WHATSAPP_PHONE_NUMBER_ID`.

### Step 3: Configure WhatsApp Webhook
1. In App Dashboard > **WhatsApp** > **Configuration**.
2. Set **Callback URL**: `https://your-domain.com/api/v1/webhooks/whatsapp`
3. Set **Verify Token**: Same `META_WEBHOOK_VERIFY_TOKEN`.
4. Subscribe to the `messages` event field.

---

## 3. OpenAI Platform (Conversational AI, STT & Embeddings)

1. Sign in to the [OpenAI Platform Dashboard](https://platform.openai.com/).
2. Navigate to **API Keys** > **Create new secret key**.
3. Name the key `omniflow-production` and assign permissions (Model capabilities).
4. Copy the key (`sk-proj-...`) and configure it in your workspace settings or as the platform default `OPENAI_API_KEY`.
5. Models utilized by OmniFlow:
   - **`gpt-4o`**: Primary multi-modal conversational reasoning and computer vision.
   - **`gpt-4o-mini`**: Fast intent classification and lightweight extraction.
   - **`text-embedding-3-small`**: High-dimensional vector embeddings for Knowledge Base.
   - **`whisper-1`**: Customer voice note transcription.

---

## 4. bKash Tokenized Checkout (Bangladesh)

OmniFlow supports bKash PGW v1.2.0-beta Tokenized Checkout.

### Step 1: Sandbox Testing
1. Register on the [bKash Developer Portal](https://developer.bKash.com/).
2. Create a test app to receive sandbox credentials:
   - `BKASH_APP_KEY`
   - `BKASH_APP_SECRET`
   - `BKASH_USERNAME`
   - `BKASH_PASSWORD`
   - Set `BKASH_SANDBOX=true`
3. Test MSISDNs and OTPs (e.g., wallet `01770618575`, OTP `123456`, PIN `12121`).

### Step 2: Live Merchant Onboarding
1. Submit Merchant Agreement, Trade License, and TIN to bKash Merchant Services.
2. Complete IP whitelisting with bKash technical operations (provide your production server IP).
3. Update credentials in OmniFlow Integrations hub with live production keys and set `BKASH_SANDBOX=false`.

---

## 5. Nagad Payment Gateway (Bangladesh)

Nagad utilizes RSA-2048 asymmetric cryptographic signing for payment initiation.

### Step 1: Generate Merchant Keypair
On your server or local machine:
```bash
# Generate 2048-bit RSA Private Key
openssl genrsa -out nagad_private.pem 2048

# Extract Public Key in PKCS8 format
openssl rsa -in nagad_private.pem -pubout -outform PEM -out nagad_public.pem
```

### Step 2: Key Exchange with Nagad
1. Send `nagad_public.pem` to the Nagad PG technical onboarding team.
2. Obtain Nagad's Public Key (`nagad_pg_public.pem`) and your assigned `Merchant ID`.
3. Save the keys in OmniFlow's encrypted credential vault via the UI or `.env`.

---

## 6. SSLCommerz Payment Gateway

1. Register at [SSLCommerz Merchant Portal](https://sslcommerz.com/).
2. Obtain **Store ID** and **Store Password**.
3. For testing, set credentials in test mode using the sandbox gateway URL (`https://sandbox.sslcommerz.com`).
4. Set IPN (Instant Payment Notification) listener URL in SSLCommerz dashboard:
   - `https://your-domain.com/api/v1/payments/sslcommerz/ipn`

---

## 7. Stripe Elements & Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/).
2. Copy `Publishable Key` and `Secret Key` (`sk_live_...`).
3. Navigate to **Developers** > **Webhooks** > **Add endpoint**.
4. Set URL to: `https://your-domain.com/api/v1/payments/stripe/webhook`
5. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
6. Copy the **Signing secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

---

## 8. Steadfast Courier Logistics

1. Log into your [Steadfast Merchant Dashboard](https://steadfast.com.bd/).
2. Navigate to **Settings** > **API Information**.
3. Copy your unique **API Key** and **Secret Key**.
4. Enter them into OmniFlow's **Integrations Hub** > **Steadfast**.
5. OmniFlow will automatically dispatch consignments, calculate delivery fees, and sync tracking statuses every 15 minutes.

---

## 9. Pathao Courier API v2

1. Log into your [Pathao Merchant Account](https://merchant.pathao.com/).
2. Navigate to **Developer API** to create an API Client:
   - Client Name: `OmniFlow Integration`
   - Redirect URI: `https://your-domain.com/api/v1/integrations/pathao/callback`
3. Obtain:
   - `Client ID`
   - `Client Secret`
4. In OmniFlow, provide your Pathao registered email and password to enable automated token refreshes via OAuth password grant.
