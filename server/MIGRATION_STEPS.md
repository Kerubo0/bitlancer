# USDT Payment Migration - Step by Step Guide

## Step 1: Run Database Migration

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project (gebpumzaljxpitwthzrb)
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the contents of `migrations/COPY_TO_SUPABASE_SQL_EDITOR.sql`
6. Paste into the SQL editor
7. Click "Run" button
8. Verify you see success messages

### Option B: Using psql Command Line

```bash
cd /Users/wandiamugo/DadaDevs/bitlancer/server
# You'll need your database password
psql "postgresql://postgres:[YOUR-PASSWORD]@db.gebpumzaljxpitwthzrb.supabase.co:5432/postgres" -f migrations/add_usdt_payment_fields.sql
```

## Step 2: Verify Migration

Run this query in Supabase SQL Editor to verify:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_links' 
AND column_name IN ('btc_address', 'usdt_amount', 'bitnob_usdt_virtual_account_id', 'payment_status');
```

You should see all 4 columns listed.

## Step 3: Configure Bitnob Webhook

1. Log in to your Bitnob dashboard (sandbox or production)
2. Navigate to Webhooks/Developer settings
3. Add webhook URL: `https://your-domain.com/api/webhooks/bitnob`
4. Select events to listen for:
   - `usdt.deposit`
   - `virtualcard.deposit`
5. Save the webhook

**Note:** For local testing, you can use ngrok:
```bash
ngrok http 5000
# Use the ngrok URL: https://xxxxx.ngrok.io/api/webhooks/bitnob
```

## Step 4: Test Backend Endpoints

```bash
# Start the server
cd /Users/wandiamugo/DadaDevs/bitlancer/server
npm start

# In a new terminal, test the endpoints
# (Replace {id} with an actual payment link ID)

# 1. Initiate payment
curl -X POST http://localhost:5000/api/payment-links/{id}/initiate

# 2. Check payment status
curl http://localhost:5000/api/payment-links/{id}/status

# 3. Test webhook (simulate USDT deposit)
curl -X POST http://localhost:5000/api/webhooks/bitnob \
  -H "Content-Type: application/json" \
  -H "x-bitnob-signature: test" \
  -d '{
    "type": "usdt.deposit",
    "data": {
      "virtualCardId": "test-card-id",
      "amount": 100,
      "currency": "USDT",
      "txHash": "0x123...",
      "sender": "0xabc...",
      "meta": {}
    }
  }'
```

## Step 5: Install QR Code Library

```bash
cd /Users/wandiamugo/DadaDevs/bitlancer/client
npm install qrcode
```

Then update the frontend to generate QR codes.

## Step 6: Test Complete Flow

1. Start backend: `cd server && npm start`
2. Start frontend: `cd client && npm run dev`
3. Create a payment link as a freelancer
4. Open the public payment page
5. Select USDT payment method
6. Verify you see:
   - USDT amount
   - Payment address
   - QR code
   - Network selector (TRC20/ERC20)

## Environment Variables Check

Verify these are set in `/server/.env`:

```
BITNOB_API_KEY=sk.1da9c04fc51c4025a327bca460185b9e...
BITNOB_API_URL=https://sandboxapi.bitnob.co
BITNOB_WEBHOOK_SECRET=df977ac59c7a6aa477b3
```

## Troubleshooting

### Migration fails
- Check you have proper permissions on the database
- Verify the payment_links table exists
- Try running statements one by one

### Webhook not receiving events
- Verify webhook URL is publicly accessible
- Check webhook secret matches in .env
- Enable webhook logging in Bitnob dashboard

### USDT virtual card creation fails
- Check Bitnob API key is valid
- Verify virtual cards are enabled in your account
- Contact Bitnob support to enable the feature

---

**Next:** Once migration is complete, proceed to test the endpoints and add QR code generation.
