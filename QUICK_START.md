# 🚀 Quick Start - USDT Payment Testing

## ✅ Backend is already running on port 50001!

## Step 1: Run Database Migration (1 minute)

1. Open: https://app.supabase.com/project/gebpumzaljxpitwthzrb/sql/new
2. Copy and paste this SQL:

```sql
ALTER TABLE payment_links
ADD COLUMN IF NOT EXISTS btc_address TEXT,
ADD COLUMN IF NOT EXISTS usdt_amount DECIMAL(20, 6),
ADD COLUMN IF NOT EXISTS bitnob_usdt_virtual_account_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS usdt_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS btc_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS btc_amount DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_payment_links_payment_status ON payment_links(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_links_usdt_account ON payment_links(bitnob_usdt_virtual_account_id);
```

3. Click **Run**
4. Verify you see "Success" messages

---

## Step 2: Start Frontend

Open a new terminal:

```bash
cd /Users/wandiamugo/DadaDevs/bitlancer/client
npm run dev
```

Frontend will start on: http://localhost:5173

---

## Step 3: Test the USDT Payment Flow

### A. Create a Payment Link (as Freelancer)
1. Login to BitLancer at http://localhost:5173
2. Navigate to Payment Links
3. Click "Create Payment Link"
4. Fill in:
   - Title: "Test USDT Payment"
   - Amount: $100
5. Click Create
6. Copy the payment link URL

### B. Open Payment Page (as Client)
1. Open the payment link in a new browser/incognito window
2. You should see:
   - Payment amount in USD
   - Converted to BTC
   - **Converted to USDT** ← New!

### C. Select USDT Payment
1. Click the **USDT** payment method button
2. Verify you see:
   - ✅ USDT amount (should equal USD amount)
   - ✅ Payment address (from Bitnob)
   - ✅ QR Code (auto-generated)
   - ✅ Network selector (TRC20/ERC20)
   - ✅ "Open Wallet to Pay" button
   - ✅ "I have sent the payment" button

### D. Test Payment Status Flow
Click "I have sent the payment" button:
- Status changes to: **"Waiting for USDT payment confirmation..."**
- Page starts polling every 10 seconds
- (In production, this waits for real USDT deposit)

---

## Step 4: Simulate USDT Deposit (Testing)

Open another terminal and simulate a webhook:

```bash
# Get a payment link ID first from your database
# Then run this curl command:

curl -X POST http://localhost:50001/api/webhooks/bitnob \
  -H "Content-Type: application/json" \
  -H "x-bitnob-signature: df977ac59c7a6aa477b3" \
  -d '{
    "type": "usdt.deposit",
    "data": {
      "virtualCardId": "PASTE_VIRTUAL_CARD_ID_HERE",
      "amount": 100,
      "currency": "USDT",
      "txHash": "0x123testinghash",
      "sender": "0xabctestaddress"
    }
  }'
```

**Note:** Get the `virtualCardId` from your payment_links table or create one first.

---

## Step 5: Watch the Magic! ✨

After simulating the webhook:
1. Frontend status updates to: **"USDT received! Converting to BTC..."**
2. Backend converts USDT → BTC (via Bitnob)
3. Backend sends BTC to freelancer
4. Status updates to: **"BTC sent to freelancer! Finalizing..."**
5. Finally: **"Payment Successful!"** page appears

---

## 🎯 What to Look For

### Frontend Features
- ✅ Payment method switcher (USDT vs Card)
- ✅ QR code displays correctly
- ✅ QR code updates when switching networks
- ✅ Status polling works
- ✅ Success page shows after completion

### Backend Logs (Check terminal running server)
Look for these logs:
```
💳 Creating USDT virtual card...
✅ USDT virtual card created!
💰 USDT deposit webhook received
🔄 Converting USDT to BTC and sending...
✅ BTC sent successfully!
```

---

## 📊 Check Database After Test

```sql
-- View payment link details
SELECT
  id, title, amount_usd, usdt_amount,
  payment_status, usdt_tx_hash, btc_tx_hash
FROM payment_links
ORDER BY created_at DESC
LIMIT 5;

-- View transaction records
SELECT
  type, amount_usd, amount_btc, payment_method, status
FROM transactions
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🐛 Common Issues

### "Payment link not found"
- Make sure you created a payment link first
- Check the URL has the correct link ID

### QR code not showing
- Open browser console (F12)
- Look for JavaScript errors
- Verify `qrcode` library is installed: `npm list qrcode`

### Webhook simulation fails
- Verify backend is running on port 50001
- Check the `virtualCardId` matches your payment link
- Ensure webhook secret matches: `df977ac59c7a6aa477b3`

### "Virtual cards not enabled"
- This is expected in sandbox mode
- Real Bitnob virtual cards require account setup
- For testing, focus on UI/UX flow

---

## 📝 Testing Checklist

- [ ] Database migration completed
- [ ] Frontend server started
- [ ] Backend server running (already ✅)
- [ ] Created test payment link
- [ ] Opened public payment page
- [ ] Selected USDT payment method
- [ ] Verified QR code displays
- [ ] Tested network switching (TRC20/ERC20)
- [ ] Clicked "I have sent payment"
- [ ] Verified status polling works
- [ ] (Optional) Simulated webhook
- [ ] Verified success page displays

---

## 📁 Helpful Files

- **Full Implementation Details:** `/USDT_PAYMENT_IMPLEMENTATION_SUMMARY.md`
- **Migration SQL:** `/server/migrations/COPY_TO_SUPABASE_SQL_EDITOR.sql`
- **Detailed Steps:** `/server/MIGRATION_STEPS.md`
- **Setup Test:** Run `node server/test-setup.js`

---

## 🎉 You're Ready!

The USDT payment system is fully implemented and ready to test. Start with Step 1 (database migration) and follow through the steps above.

**Happy Testing! 🚀**
