# Lightning Invoice Payment Flow - Complete Implementation ⚡

## Overview

Your app now has a complete payment flow that allows clients to pay invoices via Lightning Network or Bitcoin onchain, with automatic balance updates.

---

## 🔄 Complete Payment Flow

### 1. **Create Invoice** (`POST /api/invoices`)

**User Action:** Freelancer creates invoice for client

**Backend Process:**
```javascript
1. Get user's wallet_id and onchain_address from profiles
2. Get current BTC/USD exchange rate
3. Convert USD amount to BTC
4. TRY to generate Lightning invoice:
   └─ POST /api/v1/wallets/ln/createinvoice
   └─ Get payment_request (Lightning invoice string)
5. Create invoice record in database:
   ├─ invoice_number (INV-2025-00001)
   ├─ amount_btc & amount_usd
   ├─ lightning_invoice (payment_request)
   ├─ onchain_address (user's Bitcoin address)
   ├─ bitnob_invoice_reference (for webhook matching)
   └─ status: 'pending'
```

**Response to Frontend:**
```json
{
  "invoice_number": "INV-2025-00001",
  "amount_btc": 0.00123456,
  "amount_usd": 125.00,
  "lightning_invoice": "lnbc1250u1...", // QR code data
  "onchain_address": "bc1q...",          // Fallback address
  "status": "pending"
}
```

**Note:** If Lightning fails (401/404 error), invoice is still created with onchain_address only.

---

### 2. **Client Pays Invoice**

**Two Payment Methods:**

#### Option A: Lightning Payment ⚡

```
1. Client scans QR code (lightning_invoice)
2. Opens Lightning wallet (Phoenix, Wallet of Satoshi, etc.)
3. Confirms payment
4. Lightning Network processes instantly
5. Bitnob receives payment
6. Bitnob sends webhook to your server
```

#### Option B: Onchain Payment ₿

```
1. Client copies onchain_address
2. Sends Bitcoin from any wallet
3. Transaction confirmed on Bitcoin blockchain
4. Bitnob detects payment to that address
5. Bitnob sends webhook to your server
```

---

### 3. **Webhook Received** (`POST /api/webhooks/bitnob`)

**Bitnob sends webhook when payment is detected**

**Webhook Payload (Lightning):**
```json
{
  "type": "lightning.invoice.paid",
  "data": {
    "invoiceId": "bitnob_invoice_id",
    "amount": 123456,  // satoshis
    "walletId": "customer_id",
    "status": "confirmed"
  }
}
```

**Your Server Process:**
```javascript
1. Verify webhook signature (security)
2. Log webhook event in webhook_events table
3. Parse webhook type
4. Call handleLightningPaid() or handlePaymentReceived()
```

---

### 4. **Process Payment** (Automatic)

**Lightning Payment Handler:**
```javascript
async function handleLightningPaid(data) {
  // 1. Find invoice by bitnob_invoice_reference
  const invoice = await supabase
    .from('invoices')
    .select('*')
    .eq('bitnob_invoice_reference', data.invoiceId)
    .single()

  // 2. Update invoice status
  await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: NOW })
    .eq('id', invoice.id)

  // 3. Get user's current balance
  const profile = await supabase
    .from('profiles')
    .select('btc_balance, usd_balance')
    .eq('id', invoice.user_id)
    .single()

  // 4. Credit user's balance
  const newBtcBalance = profile.btc_balance + invoice.amount_btc
  const newUsdBalance = profile.usd_balance + invoice.amount_usd

  await supabase
    .from('profiles')
    .update({
      btc_balance: newBtcBalance,
      usd_balance: newUsdBalance
    })
    .eq('id', invoice.user_id)

  // 5. Create transaction record
  await supabase.from('transactions').insert({
    user_id: invoice.user_id,
    type: 'invoice',
    reference_id: invoice.id,
    reference_type: 'invoice',
    amount_btc: invoice.amount_btc,
    amount_usd: invoice.amount_usd,
    status: 'completed',
    payment_method: 'lightning',
    bitnob_transaction_id: data.invoiceId
  })

  // ✅ Done! User balance updated
}
```

---

### 5. **User Sees Updated Balance**

**Dashboard automatically refreshes:**
```javascript
// Frontend polls or uses websockets
GET /api/wallet/balance
→ Returns: { btc_balance: 0.00123456, usd_balance: 125.00 }

GET /api/transactions?limit=5
→ Shows latest transaction with "completed" status
```

---

## 📊 Database Changes

### Invoice Record (BEFORE payment):
```json
{
  "id": "uuid",
  "invoice_number": "INV-2025-00001",
  "amount_btc": 0.00123456,
  "amount_usd": 125.00,
  "status": "pending",
  "paid_at": null,
  "bitnob_invoice_reference": "bitnob_inv_xyz"
}
```

### Invoice Record (AFTER payment):
```json
{
  "id": "uuid",
  "invoice_number": "INV-2025-00001",
  "amount_btc": 0.00123456,
  "amount_usd": 125.00,
  "status": "paid",                          // ← Changed
  "paid_at": "2025-11-15T10:30:00Z",         // ← Added
  "bitnob_invoice_reference": "bitnob_inv_xyz"
}
```

### User Profile (BEFORE payment):
```json
{
  "id": "user-uuid",
  "btc_balance": 0.00000000,
  "usd_balance": 0.00
}
```

### User Profile (AFTER payment):
```json
{
  "id": "user-uuid",
  "btc_balance": 0.00123456,    // ← Increased
  "usd_balance": 125.00          // ← Increased
}
```

### New Transaction Record:
```json
{
  "id": "tx-uuid",
  "user_id": "user-uuid",
  "type": "invoice",
  "reference_id": "invoice-uuid",
  "reference_type": "invoice",
  "amount_btc": 0.00123456,
  "amount_usd": 125.00,
  "status": "completed",
  "payment_method": "lightning",
  "bitnob_transaction_id": "bitnob_inv_xyz",
  "created_at": "2025-11-15T10:30:00Z"
}
```

---

## 🚀 How to Test

### 1. **Create an Invoice**

**Frontend:**
```javascript
// User fills invoice form
POST /api/invoices
{
  "clientName": "Test Client",
  "clientEmail": "client@example.com",
  "invoiceItems": [
    { "description": "Website Design", "amount": 100.00 },
    { "description": "Logo Design", "amount": 25.00 }
  ],
  "subtotal": 125.00,
  "amountUsd": 125.00
}
```

**Server Response:**
```json
{
  "invoice_number": "INV-2025-00001",
  "lightning_invoice": "lnbc1250u1...",  // ← Client scans this QR
  "onchain_address": "bc1q...",           // ← Fallback
  "amount_btc": 0.00123456,
  "amount_usd": 125.00,
  "status": "pending"
}
```

### 2. **Test Webhook (Simulate Payment)**

Since you can't easily trigger a real payment in testing, simulate the webhook:

```bash
curl -X POST http://localhost:5000/api/webhooks/bitnob \
  -H "Content-Type: application/json" \
  -H "x-bitnob-signature: test_signature" \
  -d '{
    "type": "lightning.invoice.paid",
    "data": {
      "invoiceId": "REPLACE_WITH_BITNOB_INVOICE_REFERENCE",
      "amount": 123456,
      "walletId": "customer_id",
      "status": "confirmed"
    }
  }'
```

**Replace `invoiceId` with actual `bitnob_invoice_reference` from your invoice.**

### 3. **Check Results**

**A) Check Invoice Status:**
```sql
SELECT * FROM invoices 
WHERE invoice_number = 'INV-2025-00001';
-- Should show status = 'paid', paid_at = timestamp
```

**B) Check User Balance:**
```sql
SELECT btc_balance, usd_balance 
FROM profiles 
WHERE id = 'user-uuid';
-- Should show increased balances
```

**C) Check Transaction:**
```sql
SELECT * FROM transactions 
WHERE reference_type = 'invoice' 
ORDER BY created_at DESC 
LIMIT 1;
-- Should show completed transaction
```

---

## ⚠️ Current Status & Limitations

### ✅ **Fully Implemented:**
- Invoice creation with BTC/USD conversion
- Onchain payment address (always works)
- Webhook signature verification
- Payment processing logic
- Balance updates
- Transaction recording
- Detailed logging

### ⚠️ **Partially Working:**
- Lightning invoice generation (returns 401/404)
  - **Reason:** Lightning may not be enabled for your Bitnob account
  - **Fallback:** Invoice still created with onchain_address
  - **Action:** Contact Bitnob support to enable Lightning

### 🔧 **To Enable Lightning:**
1. Email: support@bitnob.com
2. Subject: "Enable Lightning Network for API Account"
3. Provide: Your API key (first 20 chars)
4. Ask for: Lightning invoice creation endpoint documentation

---

## 🎯 Next Steps

1. **Configure Webhook URL in Bitnob Dashboard:**
   ```
   Webhook URL: https://your-domain.com/api/webhooks/bitnob
   Webhook Secret: (copy from .env BITNOB_WEBHOOK_SECRET)
   ```

2. **Test with Real Payments:**
   - Create test invoice
   - Pay with real Lightning wallet (small amount)
   - Verify webhook received
   - Check balance updated

3. **Monitor Webhooks:**
   ```sql
   SELECT * FROM webhook_events 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

4. **Handle Failed Webhooks:**
   - Check `processed = false` records
   - Check `error` column for details
   - Manually replay if needed

---

## 📝 Summary

**The Complete Flow:**
```
Freelancer creates invoice
  ↓
Backend generates Lightning invoice + onchain address
  ↓
Client pays via Lightning or onchain
  ↓
Bitnob detects payment → sends webhook
  ↓
Your server processes webhook
  ↓
Updates invoice status to 'paid'
  ↓
Credits user's btc_balance and usd_balance
  ↓
Creates transaction record
  ↓
✅ Freelancer sees updated balance in dashboard
```

**You've implemented all 5 steps from your request! 🎉**
