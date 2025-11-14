# 🚀 BitLancer Development Checklist

Quick reference for working with the integrated Bitnob service.

## ✅ Integration Status

- [x] Bitnob service implemented
- [x] Frontend service layer created
- [x] Bitcoin utilities added
- [x] Components updated
- [x] Documentation complete
- [x] Integration tested

## 📋 Before You Start Coding

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install` in client and server)
- [ ] `.env` files created from `.env.example`
- [ ] Supabase project created
- [ ] Database schema migrated
- [ ] Bitnob API credentials obtained

### Configuration Check
```bash
# Server .env
✓ SUPABASE_URL
✓ SUPABASE_SERVICE_ROLE_KEY
✓ BITNOB_API_KEY
✓ BITNOB_API_URL
✓ BITNOB_WEBHOOK_SECRET

# Client .env
✓ VITE_SUPABASE_URL
✓ VITE_SUPABASE_ANON_KEY
✓ VITE_API_URL
```

## 🛠️ Common Tasks

### Adding a New Feature

#### 1. If it needs a new API endpoint:
```javascript
// server/src/routes/feature.routes.js
import express from 'express'
import { authenticate } from '../middleware/auth.js'
import * as controller from '../controllers/feature.controller.js'

const router = express.Router()
router.get('/', authenticate, controller.getAll)
router.post('/', authenticate, controller.create)
export default router

// server/src/server.js
import featureRoutes from './routes/feature.routes.js'
app.use('/api/features', featureRoutes)
```

#### 2. Create a controller:
```javascript
// server/src/controllers/feature.controller.js
import { supabase } from '../utils/db.js'
import bitnobService from '../../../bitnob/bitnob.service.js'

export const getAll = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('user_id', req.user.id)
    
    if (error) throw error
    res.json({ features: data })
  } catch (error) {
    next(error)
  }
}
```

#### 3. Create a frontend service:
```javascript
// client/src/services/feature.service.js
import api from '../lib/api'

class FeatureService {
  async getAll() {
    const response = await api.get('/features')
    return response.data.features
  }
  
  async create(data) {
    const response = await api.post('/features', data)
    return response.data
  }
}

export default new FeatureService()
```

#### 4. Use in component:
```javascript
// client/src/pages/Features.jsx
import { useState, useEffect } from 'react'
import featureService from '../services/feature.service'
import toast from 'react-hot-toast'

export default function Features() {
  const [features, setFeatures] = useState([])
  
  useEffect(() => {
    featureService.getAll()
      .then(setFeatures)
      .catch(err => toast.error(err.message))
  }, [])
  
  return <div>{/* UI */}</div>
}
```

### Working with Bitcoin Amounts

```javascript
import { formatBTC, formatUSD, satsToBTC, btcToSats } from '../lib/bitcoin'

// Always format before displaying
const btc = 0.00123456
console.log(formatBTC(btc))  // "0.00123456"

// Convert between units
const sats = btcToSats(0.001)     // 100000
const btcBack = satsToBTC(sats)   // 0.001

// Format USD amounts
const usd = 1234.567
console.log(formatUSD(usd))  // "1234.57"
```

### Creating Invoices

```javascript
import invoiceService from '../services/invoice.service'

const invoice = await invoiceService.createInvoice({
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  invoiceItems: [
    {
      description: 'Web Development',
      quantity: 10,
      rate: 50,
      amount: 500
    }
  ],
  subtotal: 500,
  amountUsd: 500,
})

// Invoice automatically includes:
// - Lightning invoice
// - BTC amount (auto-calculated)
// - Invoice number (auto-generated)
// - Payment request
```

### Checking Wallet Balance

```javascript
import walletService from '../services/wallet.service'
import { formatBTC, formatUSD } from '../lib/bitcoin'

const balance = await walletService.getBalance()

console.log(formatBTC(balance.btcBalance))    // BTC balance
console.log(formatUSD(balance.usdBalance))    // USD value
console.log(formatBTC(balance.pendingBalance)) // Pending
```

## 🐛 Debugging Checklist

### Frontend Issues

#### "Network Error" or API not responding
- [ ] Backend server is running (`npm run dev` in server/)
- [ ] VITE_API_URL matches backend URL
- [ ] CORS is configured correctly
- [ ] Check browser console for errors

#### "Invalid token" / Auth errors
- [ ] User is logged in
- [ ] JWT token exists in localStorage
- [ ] Token hasn't expired
- [ ] Try logging out and back in

#### Bitcoin amounts showing as "0.00000000"
- [ ] Check if balance exists
- [ ] Verify formatBTC() is being used
- [ ] Check API response in Network tab
- [ ] Ensure wallet was created

### Backend Issues

#### "Wallet not found"
- [ ] User signed up successfully
- [ ] Wallet creation didn't fail
- [ ] Check profiles table in Supabase
- [ ] Verify Bitnob API credentials

#### "Failed to create invoice"
- [ ] Wallet exists for user
- [ ] Bitnob API is accessible
- [ ] API credentials are correct
- [ ] Check server logs for details

#### Webhook not processing
- [ ] Webhook endpoint is public (no auth)
- [ ] Signature verification is working
- [ ] BITNOB_WEBHOOK_SECRET is set
- [ ] Check webhook_events table
- [ ] Verify Bitnob webhook URL

## 🧪 Testing Checklist

### Manual Testing

#### User Flow
- [ ] Sign up new user
- [ ] Wallet created automatically
- [ ] Dashboard shows addresses
- [ ] Can create invoice
- [ ] Can create payment link
- [ ] Can view transactions
- [ ] Can refresh balance
- [ ] Can log out and back in

#### Invoice Flow
- [ ] Create invoice with line items
- [ ] Invoice has Lightning invoice
- [ ] Invoice has payment request
- [ ] Can view invoice details
- [ ] Amounts formatted correctly

#### Payment Flow (when implemented)
- [ ] Public payment page loads
- [ ] Can select payment method
- [ ] Payment processes correctly
- [ ] Invoice marked as paid
- [ ] Transaction created
- [ ] Balance updated

### Automated Testing

```bash
# Test Bitnob integration
cd bitnob
node test-integration.js

# Expected output:
# ✓ Exchange rate fetched
# ✓ Conversion accuracy
# ✓ Webhook processing
# ✓ All critical tests passed!
```

## 📚 Documentation Reference

When you need help, check these files in order:

1. **Quick Start**
   - `client/SERVICES_README.md` - How to use services
   - `INTEGRATION_SUMMARY.md` - What was integrated

2. **Detailed Guides**
   - `FRONTEND_INTEGRATION.md` - Complete frontend guide
   - `BACKEND_INTEGRATION_GUIDE.md` - Backend setup
   - `ARCHITECTURE.md` - System architecture

3. **Feature Status**
   - `FEATURES.md` - What's implemented, what's not
   - `README.md` - Project overview

## 🔧 Useful Commands

```bash
# Development
cd client && npm run dev          # Start frontend
cd server && npm run dev          # Start backend
cd bitnob && node test-integration.js  # Test Bitnob

# Database
# Run in Supabase SQL Editor
SELECT * FROM profiles;           # View users
SELECT * FROM invoices;           # View invoices
SELECT * FROM transactions;       # View transactions
SELECT * FROM webhook_events;     # View webhooks

# Debugging
# Check if wallet exists
SELECT wallet_id, onchain_address FROM profiles WHERE id = 'user-id';

# Check recent transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;

# Check webhook logs
SELECT event_type, processed, created_at FROM webhook_events 
ORDER BY created_at DESC LIMIT 10;
```

## ⚡ Quick Fixes

### Clear stale auth
```javascript
localStorage.removeItem('supabase.auth.token')
```

### Reset balance cache
```sql
UPDATE profiles SET btc_balance = 0, usd_balance = 0 WHERE id = 'user-id';
```

### Manually trigger balance refresh
```javascript
import walletService from './services/wallet.service'
const balance = await walletService.getBalance()
console.log(balance)
```

## 🎯 Code Style Guidelines

### Service Methods
```javascript
// Good ✓
async getAllItems() {
  try {
    const response = await api.get('/items')
    return response.data.items
  } catch (error) {
    throw this.handleError(error)
  }
}

// Bad ✗
async getAllItems() {
  return api.get('/items').then(r => r.data.items)
}
```

### Component Structure
```javascript
// Good ✓
import { useState, useEffect } from 'react'
import serviceLayer from '../services/service'
import { utilityFunction } from '../lib/utils'

export default function Component() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    serviceLayer.getData()
      .then(setData)
      .catch(err => toast.error(err.message))
  }, [])
  
  return <div>{/* JSX */}</div>
}

// Bad ✗
import api from '../lib/api'  // Don't use api directly

export default function Component() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    api.get('/data').then(r => setData(r.data))  // Use service instead
  }, [])
}
```

### Error Handling
```javascript
// Good ✓
try {
  const result = await service.doSomething()
  toast.success('Success!')
} catch (error) {
  toast.error(error.message)  // User-friendly message
  console.error('Details:', error)  // Log for debugging
}

// Bad ✗
service.doSomething()
  .then(result => {/* ... */})
  .catch(err => console.log(err))  // No user feedback
```

## 🚀 Ready to Code!

You're all set to start developing. Remember:

1. ✅ Use services, not direct API calls
2. ✅ Use Bitcoin utilities for formatting
3. ✅ Handle errors with toast notifications
4. ✅ Show loading states
5. ✅ Keep code DRY (Don't Repeat Yourself)

Happy coding! 🎉
