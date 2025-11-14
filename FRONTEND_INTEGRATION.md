# Bitnob Frontend Integration Guide

This document explains how the Bitnob service is integrated with the BitLancer frontend.

## Architecture Overview

```
Frontend (React) → API Services → Backend (Express) → Bitnob Service → Bitnob API
```

## Directory Structure

```
client/src/
├── lib/
│   ├── api.js              # Axios instance with auth interceptors
│   └── bitcoin.js          # Bitcoin utility functions (NEW)
├── services/
│   ├── wallet.service.js       # Wallet API calls (NEW)
│   ├── invoice.service.js      # Invoice API calls (NEW)
│   ├── paymentLink.service.js  # Payment link API calls (NEW)
│   └── transaction.service.js  # Transaction API calls (NEW)
├── context/
│   └── AuthContext.jsx     # Authentication & wallet state
└── pages/
    ├── Dashboard.jsx       # Main dashboard
    ├── Balances.jsx        # Wallet balances
    ├── Invoices.jsx        # Invoice management
    ├── PaymentLinks.jsx    # Payment link management
    └── Transactions.jsx    # Transaction history
```

## New Utilities Added

### 1. Bitcoin Utilities (`lib/bitcoin.js`)

Provides helper functions for Bitcoin-related operations:

```javascript
import { formatBTC, formatUSD, copyToClipboard, shortenAddress } from '../lib/bitcoin'

// Format Bitcoin amount
formatBTC(0.00012345) // "0.00012345"

// Format USD amount
formatUSD(1234.567) // "1234.57"

// Convert satoshis to BTC
satsToBTC(100000000) // 1.0

// Convert BTC to satoshis
btcToSats(1.0) // 100000000

// Shorten address for display
shortenAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh') // "bc1qxy...fjhx0wlh"

// Copy to clipboard
await copyToClipboard('bc1qxy...') // Returns true/false

// Validate Bitcoin address
isValidBitcoinAddress('bc1qxy...') // true/false

// Validate Lightning invoice
isValidLightningInvoice('lnbc...') // true/false

// Format dates
formatDate(new Date()) // "Nov 14, 2025, 10:30 AM"
formatRelativeTime(new Date()) // "2 hours ago"
```

### 2. Service Classes

#### Wallet Service (`services/wallet.service.js`)

```javascript
import walletService from '../services/wallet.service'

// Create wallet
await walletService.createWallet(userId)

// Get wallet info
const walletInfo = await walletService.getWalletInfo()

// Get balance
const balance = await walletService.getBalance()
// Returns: { btcBalance, usdBalance, pendingBalance }
```

#### Invoice Service (`services/invoice.service.js`)

```javascript
import invoiceService from '../services/invoice.service'

// Get all invoices
const invoices = await invoiceService.getAllInvoices({ status: 'pending', limit: 50 })

// Get single invoice
const invoice = await invoiceService.getInvoice(invoiceId)

// Create invoice
const newInvoice = await invoiceService.createInvoice({
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  invoiceItems: [
    { description: 'Web Development', quantity: 10, rate: 50, amount: 500 }
  ],
  subtotal: 500,
  amountUsd: 500,
})

// Update invoice
await invoiceService.updateInvoice(invoiceId, { status: 'paid' })

// Delete invoice
await invoiceService.deleteInvoice(invoiceId)

// Generate PDF
await invoiceService.generatePDF(invoiceId)
```

#### Payment Link Service (`services/paymentLink.service.js`)

```javascript
import paymentLinkService from '../services/paymentLink.service'

// Get all payment links
const links = await paymentLinkService.getAllPaymentLinks()

// Get by slug (public)
const link = await paymentLinkService.getPaymentLinkBySlug('web-dev-service')

// Create payment link
const newLink = await paymentLinkService.createPaymentLink({
  title: 'Web Development Service',
  description: 'Payment for website development',
  amountUsd: 500,
})

// Process payment
await paymentLinkService.processPayment(linkId, {
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  paymentMethod: 'card',
})
```

#### Transaction Service (`services/transaction.service.js`)

```javascript
import transactionService from '../services/transaction.service'

// Get all transactions
const transactions = await transactionService.getAllTransactions({
  type: 'invoice',
  status: 'completed',
  limit: 50,
})

// Get single transaction
const tx = await transactionService.getTransaction(txId)
```

## Integration Examples

### Example 1: Dashboard Component

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import walletService from '../services/wallet.service'
import transactionService from '../services/transaction.service'
import { formatBTC, formatUSD } from '../lib/bitcoin'

export default function Dashboard() {
  const { walletInfo } = useAuth()
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    async function fetchData() {
      const [balanceData, txData] = await Promise.all([
        walletService.getBalance(),
        transactionService.getAllTransactions({ limit: 5 }),
      ])
      setBalance(balanceData)
      setTransactions(txData)
    }
    fetchData()
  }, [])

  return (
    <div>
      <h2>Balance: {formatBTC(balance?.btcBalance)} BTC</h2>
      <p>≈ ${formatUSD(balance?.usdBalance)} USD</p>
    </div>
  )
}
```

### Example 2: Create Invoice

```jsx
import { useState } from 'react'
import invoiceService from '../services/invoice.service'
import toast from 'react-hot-toast'

export default function CreateInvoice() {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    invoiceItems: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    amountUsd: 0,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const invoice = await invoiceService.createInvoice(formData)
      toast.success('Invoice created!')
      console.log('Lightning invoice:', invoice.lightning_invoice)
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

## Data Flow

### 1. User Signs Up
```
Signup Page → AuthContext.signUp() → Supabase Auth →
walletService.createWallet() → Backend → Bitnob API →
Wallet Created → Profile Updated
```

### 2. Create Invoice
```
Invoices Page → invoiceService.createInvoice() →
Backend → Bitnob API (generate Lightning invoice) →
Store in DB → Return to Frontend → Display
```

### 3. Receive Payment
```
Client Pays → Bitnob Webhook → Backend Webhook Handler →
Verify Signature → Update Invoice Status →
Create Transaction Record → Update Balance
```

### 4. Check Balance
```
Dashboard → walletService.getBalance() →
Backend → Bitnob API → Return Balance →
Update UI with formatBTC/formatUSD
```

## Error Handling

All service methods include proper error handling:

```javascript
try {
  const balance = await walletService.getBalance()
  // Handle success
} catch (error) {
  // error.message contains user-friendly message
  toast.error(error.message)
}
```

## Best Practices

1. **Always use service classes** instead of direct API calls
2. **Use Bitcoin utilities** for consistent formatting
3. **Handle errors gracefully** with user-friendly messages
4. **Show loading states** during API calls
5. **Refresh data** after mutations (create/update/delete)
6. **Use React hooks** properly (useEffect, useState)
7. **Memoize expensive calculations** with useMemo if needed

## Testing

### Frontend Testing
```bash
cd client
npm run dev
```

### Backend Testing
```bash
cd server
npm run dev
```

### Bitnob Integration Test
```bash
cd bitnob
node test-integration.js
```

## Environment Variables

### Client (.env)
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

### Server (.env)
```bash
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BITNOB_API_KEY=your_bitnob_api_key
BITNOB_API_URL=https://api.bitnob.co/api/v1
BITNOB_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=http://localhost:3000
```

## API Endpoints Reference

### Wallet
- `POST /api/wallet/create` - Create wallet
- `GET /api/wallet/info` - Get wallet info
- `GET /api/wallet/balance` - Get balance

### Invoices
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/generate-pdf` - Generate PDF

### Payment Links
- `GET /api/payment-links` - List payment links
- `GET /api/payment-links/slug/:slug` - Get by slug (public)
- `POST /api/payment-links` - Create payment link
- `PUT /api/payment-links/:id` - Update payment link
- `DELETE /api/payment-links/:id` - Delete payment link
- `POST /api/payment-links/:id/pay` - Process payment

### Transactions
- `GET /api/transactions` - List transactions
- `GET /api/transactions/:id` - Get transaction

### Webhooks
- `POST /api/webhooks/bitnob` - Bitnob webhook handler

## Troubleshooting

### Issue: Wallet not created on signup
**Solution:** Check that Bitnob API credentials are correct in server/.env

### Issue: Balance shows 0 when it shouldn't
**Solution:** Click "Refresh Balance" button or check Bitnob dashboard

### Issue: Invoice creation fails
**Solution:** Verify wallet exists, check Bitnob API status

### Issue: CORS errors
**Solution:** Ensure FRONTEND_URL in server/.env matches client URL

### Issue: "Invalid token" error
**Solution:** Log out and log back in to refresh auth token

## Next Steps

1. ✅ Frontend utilities created
2. ✅ Service classes implemented
3. ✅ Pages updated to use new services
4. 🔲 Add unit tests for services
5. 🔲 Implement payment gateway (Stripe)
6. 🔲 Add PDF generation
7. 🔲 Implement email notifications
8. 🔲 Add QR code generation

## Support

For issues or questions:
1. Check the FEATURES.md for implementation status
2. Review BACKEND_INTEGRATION_GUIDE.md for setup
3. Run test-integration.js for diagnostics
4. Check browser console for errors
5. Verify all environment variables are set
