# Backend Integration Guide for BitLancer

This guide is for backend developers to integrate Bitnob API and set up the Supabase database.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Bitnob API Integration](#bitnob-api-integration)
4. [Testing the Integration](#testing-the-integration)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:
- [ ] A Supabase account (https://supabase.com)
- [ ] A Bitnob account with API access (https://bitnob.com)
- [ ] Node.js 18+ installed
- [ ] Access to this codebase

---

## Part 1: Supabase Setup

### Step 1.1: Create Supabase Project

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Create a New Project**:
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - **Name**: `bitlancer-production` (or your preferred name)
     - **Database Password**: Create a strong password (SAVE THIS!)
     - **Region**: Choose closest to your users (e.g., `East US`, `EU West`)
   - Click "Create new project"
   - Wait ~2 minutes for provisioning

### Step 1.2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings → API**
2. Copy the following values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (KEEP SECRET!)
```

### Step 1.3: Run Database Migrations

1. In Supabase Dashboard, navigate to **SQL Editor**
2. Open the file `supabase-schema.sql` from the project root
3. Copy **ALL** the SQL content
4. Paste into the SQL Editor
5. Click **RUN** (bottom right)
6. You should see: "Success. No rows returned"

**What this creates:**
- ✅ 5 tables: `profiles`, `invoices`, `payment_links`, `transactions`, `webhook_events`
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for `updated_at` timestamps
- ✅ Helper functions (invoice numbering, slug generation)

### Step 1.4: Verify Database Setup

In the Supabase Dashboard:
1. Go to **Table Editor**
2. You should see these tables:
   - `profiles`
   - `invoices`
   - `payment_links`
   - `transactions`
   - `webhook_events`

### Step 1.5: Configure Environment Variables

Update `server/.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (your service_role key)
SUPABASE_ANON_KEY=eyJhbGci... (your anon key)
```

Update `client/.env`:

```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (your anon key)
VITE_API_URL=http://localhost:5000
```

---

## Part 2: Bitnob API Integration

### Step 2.1: Get Bitnob API Credentials

1. **Sign up at Bitnob**: https://bitnob.com
2. **Complete KYC Verification**:
   - This may take 1-3 business days
   - Required for API access
3. **Generate API Keys**:
   - Go to Bitnob Dashboard → Settings → API
   - Click "Generate API Key"
   - Copy your API Key (SAVE THIS - shown only once!)
   - Generate a Webhook Secret for security

### Step 2.2: Configure Bitnob Environment Variables

Update `server/.env`:

```bash
# Bitnob Configuration
BITNOB_API_KEY=your_actual_api_key_here
BITNOB_API_URL=https://api.bitnob.co/api/v1
BITNOB_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 2.3: Understanding the Bitnob Service

The Bitnob integration is in `bitnob/bitnob.service.js`. Here's what each function does:

#### Core Functions:

**1. `createWallet(userId, email)`**
- **Called when**: User signs up
- **What it does**: Creates a Bitcoin wallet via Bitnob API
- **Returns**:
  ```javascript
  {
    walletId: "wallet_123abc",
    onchainAddress: "bc1q...",
    lightningAddress: "user@bitnob.co",
    balance: 0
  }
  ```
- **Bitnob Endpoint**: `POST /wallets`
- **Request Body**:
  ```json
  {
    "customerEmail": "user@example.com",
    "customerId": "uuid-from-supabase"
  }
  ```

**2. `getBalance(walletId)`**
- **Called when**: Dashboard loads, balance refresh
- **What it does**: Fetches current wallet balance
- **Returns**:
  ```javascript
  {
    btcBalance: 0.00050000,
    usdBalance: 25.00,
    pendingBalance: 0.00000000
  }
  ```
- **Bitnob Endpoint**: `GET /wallets/{walletId}/balance`

**3. `generateLightningInvoice(walletId, amountSats, description)`**
- **Called when**: Creating an invoice for a client
- **What it does**: Generates Lightning Network payment request
- **Parameters**:
  - `walletId`: User's Bitnob wallet ID
  - `amountSats`: Amount in satoshis (1 BTC = 100,000,000 sats)
  - `description`: Invoice memo/description
- **Returns**:
  ```javascript
  {
    invoiceId: "inv_123",
    paymentRequest: "lnbc250n1...", // Lightning invoice string
    paymentHash: "abc123...",
    amount: 25000, // in satoshis
    expiresAt: "2025-11-15T12:00:00Z"
  }
  ```
- **Bitnob Endpoint**: `POST /wallets/{walletId}/lightning/invoice`
- **Request Body**:
  ```json
  {
    "amount": 25000,
    "description": "Invoice for Client XYZ",
    "expiry": 3600
  }
  ```

**4. `creditWallet(walletId, amountBtc, reference)`**
- **Called when**: Client pays via card/bank (fiat payment)
- **What it does**: Credits BTC to freelancer's wallet after fiat payment
- **Parameters**:
  - `walletId`: Freelancer's wallet ID
  - `amountBtc`: Amount in BTC (already converted from USD)
  - `reference`: Payment reference for tracking
- **Bitnob Endpoint**: `POST /virtual-accounts/credit`
- **Request Body**:
  ```json
  {
    "walletId": "wallet_123",
    "amount": 0.00025,
    "reference": "payment_link_xyz"
  }
  ```

**5. `getBtcUsdRate()` & `convertUsdToBtc(usdAmount)`**
- **Called when**: Creating invoices, payment links
- **What it does**: Gets current BTC/USD exchange rate and converts amounts
- **Bitnob Endpoint**: `GET /rates/btc-usd`
- **Fallback**: Uses Coinbase API if Bitnob rate fails

### Step 2.4: Key Integration Points

#### A. User Signup Flow

**File**: `client/src/context/AuthContext.jsx` (already implemented)

```javascript
// When user signs up:
1. Supabase creates auth user
2. Backend calls: await api.post('/wallet/create', { userId })
3. Server creates Bitnob wallet
4. Wallet info saved to profiles table
```

**Backend endpoint** (`server/src/controllers/wallet.controller.js`):
```javascript
export const createWallet = async (req, res, next) => {
  const { userId } = req.body
  const user = req.user

  // Call Bitnob
  const walletData = await bitnobService.createWallet(userId, user.email)

  // Save to Supabase
  await supabase.from('profiles').upsert({
    id: userId,
    wallet_id: walletData.walletId,
    onchain_address: walletData.onchainAddress,
    lightning_address: walletData.lightningAddress,
    btc_balance: 0,
    usd_balance: 0,
  })
}
```

#### B. Invoice Creation Flow

**File**: `server/src/controllers/invoice.controller.js` (already implemented)

```javascript
// When freelancer creates invoice:
1. Get BTC/USD rate from Bitnob
2. Convert invoice amount to BTC
3. Generate Lightning invoice via Bitnob
4. Save invoice to database with Lightning payment request
5. Return invoice to frontend
```

**What client pays**:
- Shows Lightning QR code
- Can pay with Lightning wallet
- Payment detected via webhook

#### C. Payment Link Flow

**File**: `server/src/controllers/paymentLink.controller.js`

```javascript
// When client pays via payment link:
1. Client enters card/bank details
2. Process fiat payment (Stripe/Flutterwave)
3. Convert USD → BTC using current rate
4. Call bitnobService.creditWallet()
5. BTC credited to freelancer wallet
6. Update transaction record
```

**Payment processors to integrate**:
- **Stripe** (international cards)
- **Flutterwave** (African payments, M-Pesa, bank transfers)

### Step 2.5: Webhook Integration

Webhooks notify your server when payments are received.

#### Configure Bitnob Webhook

1. In Bitnob Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/bitnob`
3. Set webhook secret (same as in `.env`)

#### Webhook Events

**File**: `server/src/controllers/webhook.controller.js` (already implemented)

The webhook handler processes these events:

**Event: `payment.received`**
```json
{
  "type": "payment.received",
  "data": {
    "walletId": "wallet_123",
    "amount": 0.00025,
    "hash": "abc123...",
    "confirmations": 1
  }
}
```
**Action**: Update user balance, create transaction record

**Event: `lightning.invoice.paid`**
```json
{
  "type": "lightning.invoice.paid",
  "data": {
    "invoiceId": "inv_123",
    "amount": 25000,
    "walletId": "wallet_123"
  }
}
```
**Action**: Mark invoice as paid, update balance

**Event: `withdrawal.completed`**
```json
{
  "type": "withdrawal.completed",
  "data": {
    "id": "txn_123",
    "amount": 0.0005,
    "status": "completed"
  }
}
```
**Action**: Update transaction status

---

## Part 3: Testing the Integration

### Step 3.1: Start the Application

**Terminal 1 - Server:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm install
npm run dev
```

### Step 3.2: Test User Registration

1. Open http://localhost:3000
2. Click "Sign up"
3. Enter email and password
4. Check terminal for wallet creation logs
5. Verify in Supabase:
   - Go to Table Editor → `profiles`
   - Your user should have `wallet_id`, `onchain_address`, `lightning_address`

### Step 3.3: Test Invoice Creation

1. Log in to the app
2. Go to **Invoices** page
3. Click "Create Invoice"
4. Fill in client details and items
5. Submit

**What should happen**:
- Invoice saved to database
- Lightning invoice generated via Bitnob
- Check Supabase `invoices` table for new record
- `lightning_invoice` field should contain payment request

### Step 3.4: Test Payment Link

1. Go to **Payment Links** page
2. Click "Create Payment Link"
3. Enter title, description, amount
4. Copy the generated link
5. Open in incognito window
6. Should show public payment page

### Step 3.5: Test Webhooks (Local Development)

For local testing, use **ngrok** to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose port 5000
ngrok http 5000
```

You'll get a URL like: `https://abc123.ngrok.io`

Configure in Bitnob:
- Webhook URL: `https://abc123.ngrok.io/api/webhooks/bitnob`

To test webhook manually:
```bash
curl -X POST http://localhost:5000/api/webhooks/bitnob \
  -H "Content-Type: application/json" \
  -H "x-bitnob-signature: your_secret" \
  -d '{
    "type": "lightning.invoice.paid",
    "data": {
      "invoiceId": "test_invoice_123",
      "amount": 25000,
      "walletId": "your_wallet_id"
    }
  }'
```

---

## Part 4: Production Deployment

### Step 4.1: Deploy Backend

**Recommended platforms**:
- Railway (easiest)
- Render
- Heroku
- AWS/GCP

**Environment variables to set**:
```bash
NODE_ENV=production
PORT=5000
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
BITNOB_API_KEY=...
BITNOB_API_URL=https://api.bitnob.co/api/v1
BITNOB_WEBHOOK_SECRET=...
FRONTEND_URL=https://yourdomain.com
```

### Step 4.2: Deploy Frontend

**Recommended platforms**:
- Vercel (recommended)
- Netlify

**Build settings**:
- Build command: `cd client && npm run build`
- Output directory: `client/dist`

**Environment variables**:
```bash
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=https://your-api-domain.com
```

### Step 4.3: Configure Production Webhooks

In Bitnob Dashboard:
- Webhook URL: `https://your-api-domain.com/api/webhooks/bitnob`
- Webhook secret: (same as in env vars)

---

## Part 5: Important Bitnob API Notes

### Rate Limits
- **Development**: 100 requests/minute
- **Production**: 1000 requests/minute

### Satoshi Conversion
```javascript
// Always work in satoshis for Lightning
1 BTC = 100,000,000 satoshis
$50 USD → 0.0025 BTC → 250,000 sats

// Convert USD to satoshis:
const usdAmount = 50
const btcAmount = await bitnobService.convertUsdToBtc(usdAmount)
const satoshis = Math.floor(btcAmount * 100000000)
```

### Lightning Invoice Expiry
- Default: 1 hour (3600 seconds)
- Recommended: 1-24 hours for invoices
- After expiry, client cannot pay

### Network Fees
- **Lightning**: Very low (~1 satoshi)
- **On-chain**: Variable (50-500 sats depending on network)
- Bitnob may charge small service fee

### Testing Mode
Bitnob provides a **sandbox environment** for testing:
```bash
BITNOB_API_URL=https://sandbox-api.bitnob.co/api/v1
```
Use sandbox API keys for development.

---

## Part 6: Payment Gateway Integration

For fiat (card/bank) payments, integrate:

### Option 1: Stripe (International)

```bash
npm install stripe
```

```javascript
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// In payment link controller
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amountUsd * 100), // cents
  currency: 'usd',
  metadata: {
    paymentLinkId: linkId,
    userId: merchantId
  }
})

// After payment success
const btcAmount = await bitnobService.convertUsdToBtc(amountUsd)
await bitnobService.creditWallet(merchantWalletId, btcAmount, reference)
```

### Option 2: Flutterwave (African markets)

```bash
npm install flutterwave-node-v3
```

```javascript
import Flutterwave from 'flutterwave-node-v3'
const flw = new Flutterwave(FLW_PUBLIC_KEY, FLW_SECRET_KEY)

// Accept M-Pesa, bank transfers, cards
const payload = {
  tx_ref: `bitlancer_${Date.now()}`,
  amount: amountUsd,
  currency: 'KES', // or USD
  payment_options: 'card,mobilemoney,ussd',
  customer: {
    email: customerEmail,
    name: customerName
  },
  customizations: {
    title: 'BitLancer Payment',
    description: paymentLink.title
  }
}

const response = await flw.Charge.card(payload)
```

---

## Part 7: Security Checklist

- [ ] **Never commit** `.env` files to git
- [ ] Use `SUPABASE_SERVICE_ROLE_KEY` only on backend
- [ ] Verify webhook signatures before processing
- [ ] Enable RLS on all Supabase tables (already done in schema)
- [ ] Use HTTPS in production
- [ ] Implement rate limiting (use `express-rate-limit`)
- [ ] Validate all user inputs with Zod
- [ ] Sanitize database queries
- [ ] Log all Bitcoin transactions
- [ ] Set up monitoring (Sentry, LogRocket)

---

## Part 8: Troubleshooting

### Issue: Wallet creation fails

**Check**:
1. Bitnob API key is correct
2. KYC is approved on Bitnob
3. Email is valid format
4. Check Bitnob dashboard for error logs

### Issue: Lightning invoice not generating

**Check**:
1. Wallet ID exists in database
2. Amount is positive and > 0
3. Satoshi conversion is correct
4. Bitnob API is not down (check status.bitnob.com)

### Issue: Webhooks not received

**Check**:
1. Webhook URL is publicly accessible
2. SSL certificate is valid
3. Webhook secret matches
4. Check Bitnob webhook logs in dashboard
5. Use ngrok for local testing

### Issue: Balance not updating

**Check**:
1. Webhook handler is processing events
2. `wallet_id` in database matches Bitnob
3. Check `webhook_events` table for errors
4. Verify RLS policies allow updates

---

## Part 9: Next Steps

After basic integration works:

1. **Add PDF generation** for invoices (jsPDF)
2. **Email notifications** (SendGrid, Resend)
3. **Withdrawal feature** (let users send BTC out)
4. **Multi-currency support** (EUR, GBP, KES)
5. **Analytics dashboard** (revenue, transaction volume)
6. **Recurring invoices**
7. **Team/organization accounts**

---

## Support & Resources

- **Bitnob API Docs**: https://docs.bitnob.com
- **Supabase Docs**: https://supabase.com/docs
- **Lightning Network**: https://lightning.network/
- **Project Issues**: Create issues in the GitHub repo

## Questions?

For technical support:
- Check `FEATURES.md` for implementation details
- Review `server/src/controllers/` for API logic
- Test endpoints with Postman/Insomnia
- Check server logs for errors

---

**Good luck with the integration! 🚀**
