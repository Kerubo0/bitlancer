# 🔍 Wallet Creation Debug Guide

## Issues Found & Solutions

### ❌ **CRITICAL ISSUE #1: Missing server/.env file**

Your backend needs a `.env` file but you only have `.env.example`.

**Fix:**
```bash
cd server
cp .env.example .env
```

Then verify the Bitnob API key is correct in `server/.env`.

---

### ❌ **ISSUE #2: Import Path Mismatch**

**Problem:** Controllers import from `../services/bitnob.service.js` but the service is actually in `/server/src/services/bitnob.service.js`.

**Current imports in controllers:**
```javascript
import bitnobService from '../services/bitnob.service.js'
```

This is correct IF the file exists. ✅ File exists, so this is OK.

---

### ⚠️ **ISSUE #3: Backend Server Not Running**

The wallet creation happens on the backend, but your backend server must be running.

**Check if backend is running:**
```bash
# This should show a process on port 5000
curl http://localhost:5000/health
```

If you get "Connection refused", start the backend:
```bash
cd server
npm run dev
```

---

## 🔍 Diagnostic Checklist

Run through these steps to find the exact issue:

### 1. **Check Backend Environment**
```bash
cd server
cat .env | grep BITNOB_API_KEY
# Should show: BITNOB_API_KEY=sk.1da9c04fc51c4025a327bca460185b9e...
```

### 2. **Check Backend is Running**
```bash
curl http://localhost:5000/health
# Expected: {"status":"OK","timestamp":"..."}
# If error: Backend is not running!
```

### 3. **Check Frontend Can Reach Backend**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return user data or 401 Unauthorized
```

### 4. **Test Wallet Creation Endpoint Directly**
```bash
# First get your auth token from localStorage in browser console:
# localStorage.getItem('supabase.auth.token')

curl -X POST http://localhost:5000/api/wallet/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"userId":"YOUR_USER_ID"}'
```

---

## 🚀 Step-by-Step Fix

### Step 1: Create server/.env file
```bash
cd /home/subchief/bit/bitlancer/server
cp .env.example .env
```

### Step 2: Verify .env has Bitnob credentials
```bash
cat .env | grep BITNOB
```

Should show:
```
BITNOB_API_KEY=sk.1da9c04fc51c4025a327bca460185b9e...
BITNOB_API_URL=https://api.bitnob.co/api/v1
BITNOB_WEBHOOK_SECRET=df977ac59c7a6aa477b3
```

### Step 3: Start backend server
```bash
cd /home/subchief/bit/bitlancer/server
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📡 Environment: development
```

### Step 4: Test backend health
```bash
curl http://localhost:5000/health
```

### Step 5: Start frontend
```bash
cd /home/subchief/bit/bitlancer/client
npm run dev
```

### Step 6: Try signing up
Go to http://localhost:3000/signup and create a new account.

---

## 🐛 Common Errors & Solutions

### Error: "Failed to create Bitcoin wallet"

**Cause:** Bitnob API call failed

**Debug:**
1. Check backend console logs for exact error
2. Verify Bitnob API key is correct
3. Check if Bitnob API is accessible

**Test Bitnob API directly:**
```bash
curl -X POST https://api.bitnob.co/api/v1/wallets \
  -H "Authorization: Bearer sk.1da9c04fc51c4025a327bca460185b9e..." \
  -H "Content-Type: application/json" \
  -d '{"customerEmail":"test@example.com","customerId":"test123"}'
```

### Error: "Network Error" or "Cannot POST /api/wallet/create"

**Cause:** Backend server not running or wrong URL

**Fix:**
1. Make sure backend is running on port 5000
2. Check `client/.env` has `VITE_API_URL=http://localhost:5000`
3. Restart both frontend and backend

### Error: "Wallet already exists"

**Cause:** User already has a wallet

**Fix:**
1. This is actually OK! Wallet was created previously
2. Check Supabase `profiles` table for `wallet_id`
3. If wallet exists but doesn't show, it's a display issue not creation issue

### Error: "401 Unauthorized"

**Cause:** JWT token issue

**Fix:**
1. Log out and log back in
2. Clear localStorage: `localStorage.clear()`
3. Sign up again

---

## 📊 Verify Wallet Was Created

### Check in Supabase Dashboard:
1. Go to https://supabase.com
2. Open your project
3. Go to Table Editor → profiles
4. Look for your user's row
5. Check if `wallet_id`, `onchain_address`, `lightning_address` are filled

### Check via API:
```bash
# Get wallet info
curl http://localhost:5000/api/wallet/info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check in Browser Console:
```javascript
// In browser console after login
const token = localStorage.getItem('supabase.auth.token')
const response = await fetch('http://localhost:5000/api/wallet/info', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const data = await response.json()
console.log(data)
```

---

## 🧪 Manual Test Script

Save this as `test-wallet-creation.js` in the server directory:

```javascript
import bitnobService from './src/services/bitnob.service.js'

async function testWalletCreation() {
  try {
    console.log('Testing wallet creation...')
    
    const wallet = await bitnobService.createWallet(
      'test-user-' + Date.now(),
      'test@example.com'
    )
    
    console.log('✅ Wallet created successfully!')
    console.log('Wallet ID:', wallet.walletId)
    console.log('On-chain Address:', wallet.onchainAddress)
    console.log('Lightning Address:', wallet.lightningAddress)
  } catch (error) {
    console.error('❌ Wallet creation failed:', error.message)
  }
}

testWalletCreation()
```

Run it:
```bash
cd server
node test-wallet-creation.js
```

---

## 📝 Integration Error Checklist

- [ ] Server `.env` file exists
- [ ] Bitnob API key is set in server `.env`
- [ ] Backend server is running on port 5000
- [ ] Frontend can reach backend (check Network tab)
- [ ] User is authenticated (JWT token exists)
- [ ] Supabase connection is working
- [ ] No CORS errors in browser console
- [ ] Bitnob API is accessible from server

---

## 🎯 Most Likely Issues (In Order)

1. **Server `.env` missing** ← START HERE
2. **Backend not running**
3. **Bitnob API key invalid**
4. **Network/CORS issues**
5. **Supabase auth token expired**

---

## 💡 Quick Fix Commands

```bash
# Quick fix everything
cd /home/subchief/bit/bitlancer

# 1. Create server .env
cd server
cp .env.example .env

# 2. Start backend (in one terminal)
npm run dev

# 3. Start frontend (in another terminal)
cd ../client
npm run dev

# 4. Test signup at http://localhost:3000/signup
```

---

## 📞 Still Having Issues?

Check these logs in order:

1. **Browser Console** - Look for network errors
2. **Backend Console** - Look for Bitnob API errors
3. **Supabase Logs** - Check for database errors
4. **Network Tab** - Check if API calls are reaching backend

The error message will tell you exactly what's wrong!
