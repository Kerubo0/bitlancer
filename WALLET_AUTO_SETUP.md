# Automatic Wallet Creation Setup

## Overview
This guide explains how to enable automatic wallet creation when users sign up.

## How It Works

### 1. **Database Trigger** (Supabase SQL)
When a user signs up via Supabase Auth, a trigger automatically creates their profile.

### 2. **Wallet Initialization** (Backend API)
After signup/login, the frontend calls `/api/auth/init-wallet` to create the Bitcoin wallet.

### 3. **Fallback Protection** (Invoice Controller)
If a wallet still doesn't exist when creating an invoice, it auto-creates one.

---

## Setup Steps

### Step 1: Run SQL Trigger in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this SQL to create the automatic profile trigger:

```sql
-- Create automatic profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

4. Click **RUN** to execute

### Step 2: Verify Backend Server is Running

The backend automatically has the new `/api/auth/init-wallet` endpoint.

Just make sure your server is running:
```bash
cd server
npm run dev
```

### Step 3: Test the Flow

1. **Sign up a new user** from the frontend
2. Check the browser console - you should see:
   ```
   ✅ Wallet initialized: Wallet created successfully
   ```
3. Go to Dashboard - wallet info should be displayed
4. Create an invoice - should work immediately without "No wallet found" error

---

## User Flow After Setup

### On Signup:
```
1. User submits signup form
   ↓
2. Supabase creates auth.users record
   ↓
3. SQL trigger creates profiles record (with email, full_name)
   ↓
4. Frontend calls /api/auth/init-wallet
   ↓
5. Backend creates Bitnob wallet
   ↓
6. Profile updated with wallet_id, onchain_address
   ↓
7. ✅ User ready to create invoices!
```

### On Login (existing users without wallets):
```
1. User logs in
   ↓
2. Frontend checks for wallet
   ↓
3. If no wallet: calls /api/auth/init-wallet
   ↓
4. Backend creates wallet
   ↓
5. ✅ User ready to use app!
```

### Fallback (if all else fails):
```
1. User creates invoice
   ↓
2. Invoice controller checks for wallet
   ↓
3. If no wallet: auto-creates one
   ↓
4. Invoice created successfully
   ↓
5. ✅ Seamless experience!
```

---

## Troubleshooting

### "Profile not found" error
- The SQL trigger might not be set up
- Run the SQL commands in Step 1 above

### "Wallet creation failed" on signup
- Check Bitnob API credentials in `.env`
- Verify `BITNOB_API_KEY` is set correctly
- Check server logs for detailed error

### Invoice still shows "No wallet found"
- This shouldn't happen with the new auto-creation in `invoice.controller.js`
- Check server logs to see if wallet creation is being attempted
- Verify user is authenticated (has valid session token)

---

## Benefits

✅ **Seamless onboarding** - Users don't need to manually create wallets
✅ **Triple redundancy** - 3 places where wallet can be auto-created
✅ **Better UX** - No confusing "create wallet first" errors
✅ **Automatic** - Works for new signups and existing users
✅ **Safe** - Multiple checks prevent duplicate wallet creation

---

## Database State

After setup, when a user signs up:

```sql
-- auth.users table
id: 'abc-123'
email: 'user@example.com'
raw_user_meta_data: { "full_name": "John Doe" }

-- public.profiles table (auto-created by trigger)
id: 'abc-123'
email: 'user@example.com'
full_name: 'John Doe'
wallet_id: 'customer_xyz' (created by init-wallet endpoint)
onchain_address: 'bc1q...' (created by init-wallet endpoint)
btc_balance: 0
usd_balance: 0
```

---

## Next Steps

After running the SQL trigger:
1. Test signup with a new user
2. Verify wallet is created automatically
3. Try creating an invoice immediately after signup
4. Check that payment addresses are generated

Your users will now have a completely seamless Bitcoin wallet experience! 🚀
