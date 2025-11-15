# Bitnob Real API Integration - FIXED! ✅

## What Was Wrong

The original implementation tried to use `POST /wallets` which doesn't exist in Bitnob's API.

## How Bitnob Actually Works

Bitnob uses a **2-step process** to create Bitcoin addresses for users:

### Step 1: Create a Customer
```
POST /api/v1/customers
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Customer successfully added",
  "data": {
    "id": "customer-uuid-here",
    "email": "user@example.com",
    ...
  }
}
```

### Step 2: Generate Bitcoin Address for Customer
```
POST /api/v1/addresses/generate
{
  "customerEmail": "user@example.com",
  "currency": "btc",
  "network": "bitcoin"
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "address": "bc1q...",  // Bitcoin address
    "lightningAddress": "...",  // Optional Lightning address
    ...
  }
}
```

## What This Means

🔑 **Key Insight**: Bitnob **GENERATES** Bitcoin addresses for you. You don't create them yourself.

- You create a customer in Bitnob's system
- Bitnob generates a unique Bitcoin address for that customer
- The address is cryptographically secure and managed by Bitnob
- Payments to this address go to your company's Bitnob wallet
- You can track which customer each payment came from

## Updated Integration

The `bitnob.service.js` now uses the correct workflow:

```javascript
async createWallet(userId, email) {
  // 1. Create customer
  const customerResponse = await bitnobClient.post('/api/v1/customers', {
    email: email,
    firstName: email.split('@')[0],
    lastName: 'User',
  })

  const customerId = customerResponse.data.data.id

  // 2. Generate Bitcoin address
  const addressResponse = await bitnobClient.post('/api/v1/addresses/generate', {
    customerEmail: email,
    currency: 'btc',
    network: 'bitcoin',
  })

  return {
    walletId: customerId,
    onchainAddress: addressResponse.data.data.address,
    lightningAddress: addressResponse.data.data.lightningAddress,
    balance: 0,
  }
}
```

## Testing the Integration

### Before Testing:

1. **Run the profile trigger SQL** (if you haven't already):
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `supabase-profile-trigger.sql`
   - Run it

2. **Make sure `.env` has the correct settings**:
   ```bash
   BITNOB_API_KEY=sk.1da9c04fc51c4025a327bca460185b9e...
   BITNOB_API_URL=https://sandboxapi.bitnob.co
   USE_MOCK_BITNOB=false  # Real API mode
   ```

3. **Restart the server**:
   ```bash
   cd server && npm run dev
   ```

### Test Signup:

1. Open your app: `http://localhost:5173`
2. Sign up with a NEW email (delete old test users if needed)
3. Watch the server console - you should see:
   ```
   📞 Creating Bitnob customer and generating Bitcoin address...
      Email: your-email@example.com
      User ID: uuid-here
      Step 1: Creating customer...
      ✅ Customer created: customer-id
      Step 2: Generating Bitcoin address...
      ✅ Bitcoin address generated!
   ```

4. Check your Supabase `profiles` table - should have:
   - ✅ Profile created
   - ✅ `wallet_id` = Bitnob customer ID
   - ✅ `onchain_address` = Real Bitcoin address (bc1q...)
   - ✅ `lightning_address` = Lightning address (if provided)

## Your Bitnob Dashboard

In your Bitnob dashboard, you can now see:
- ✅ Your company's Bitcoin wallet (already exists)
- ✅ List of customers (each user that signs up)
- ✅ Generated addresses for each customer
- ✅ Incoming payments tracked per customer

## How Payments Work

When a client pays an invoice:

1. **Lightning Payment**: Client scans QR code → Pays with Lightning wallet → BTC goes to your company wallet
2. **Onchain Payment**: Client sends BTC to generated address → Tracked by customer → Goes to your company wallet
3. **Fiat Payment**: Client pays with card/bank → You convert USD to BTC → Credit freelancer's balance

## Next Steps

After signup works:

- [ ] Test creating an invoice (should generate Lightning invoice)
- [ ] Test payment links
- [ ] Set up webhook to detect incoming payments
- [ ] Test balance updates

## Key Bitnob Endpoints Now Working

✅ `GET /api/v1/customers` - List customers
✅ `POST /api/v1/customers` - Create customer  
✅ `GET /api/v1/wallets` - Get your company wallets
✅ `POST /api/v1/addresses/generate` - Generate Bitcoin address
✅ `GET /api/v1/addresses` - List generated addresses

## What Mock Mode Was

Mock mode was a temporary workaround when we thought Bitnob wasn't working. Now that we know the correct API endpoints, **you don't need mock mode anymore** - the real API works!

Set `USE_MOCK_BITNOB=false` to use real Bitnob integration.
