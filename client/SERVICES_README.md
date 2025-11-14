# BitLancer Frontend Services

Quick reference guide for using the frontend services.

## Installation Complete ✅

All services have been integrated into the BitLancer frontend. Here's what's been added:

## 📁 New Files Created

### Utilities
- `client/src/lib/bitcoin.js` - Bitcoin formatting and validation utilities

### Services
- `client/src/services/wallet.service.js` - Wallet operations
- `client/src/services/invoice.service.js` - Invoice management
- `client/src/services/paymentLink.service.js` - Payment link operations
- `client/src/services/transaction.service.js` - Transaction queries

### Documentation
- `FRONTEND_INTEGRATION.md` - Complete integration guide
- `bitnob/test-integration.js` - Integration test script

## 🚀 Quick Start

### 1. Import the service you need

```javascript
import walletService from '../services/wallet.service'
import invoiceService from '../services/invoice.service'
import paymentLinkService from '../services/paymentLink.service'
import transactionService from '../services/transaction.service'
import { formatBTC, formatUSD, copyToClipboard } from '../lib/bitcoin'
```

### 2. Use in your components

```javascript
// Get wallet balance
const balance = await walletService.getBalance()
console.log(formatBTC(balance.btcBalance)) // "0.00123456"

// Create an invoice
const invoice = await invoiceService.createInvoice({
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  invoiceItems: [{ description: 'Service', quantity: 1, rate: 100, amount: 100 }],
  amountUsd: 100,
})

// Get all transactions
const transactions = await transactionService.getAllTransactions({ limit: 10 })
```

## 📚 Service Methods

### WalletService
```javascript
walletService.createWallet(userId)      // Create new wallet
walletService.getWalletInfo()           // Get wallet details
walletService.getBalance()              // Get current balance
```

### InvoiceService
```javascript
invoiceService.getAllInvoices(params)   // List invoices
invoiceService.getInvoice(id)           // Get single invoice
invoiceService.createInvoice(data)      // Create invoice
invoiceService.updateInvoice(id, data)  // Update invoice
invoiceService.deleteInvoice(id)        // Delete invoice
invoiceService.generatePDF(id)          // Generate PDF
```

### PaymentLinkService
```javascript
paymentLinkService.getAllPaymentLinks(params)  // List payment links
paymentLinkService.getPaymentLink(id)          // Get by ID
paymentLinkService.getPaymentLinkBySlug(slug)  // Get by slug (public)
paymentLinkService.createPaymentLink(data)     // Create link
paymentLinkService.updatePaymentLink(id, data) // Update link
paymentLinkService.deletePaymentLink(id)       // Delete link
paymentLinkService.processPayment(id, data)    // Process payment
```

### TransactionService
```javascript
transactionService.getAllTransactions(params)  // List transactions
transactionService.getTransaction(id)          // Get single transaction
```

## 🛠️ Bitcoin Utilities

```javascript
// Formatting
formatBTC(0.00123456)           // "0.00123456"
formatUSD(1234.56)              // "1234.56"

// Conversion
satsToBTC(100000000)            // 1.0
btcToSats(1.0)                  // 100000000

// Display helpers
shortenAddress('bc1q...')       // "bc1qxy...0wlh"
copyToClipboard('text')         // Copy to clipboard

// Validation
isValidBitcoinAddress('bc1q...') // true/false
isValidLightningInvoice('lnbc...') // true/false

// Date formatting
formatDate(new Date())           // "Nov 14, 2025, 10:30 AM"
formatRelativeTime(new Date())   // "2 hours ago"
```

## ✨ Updated Components

The following pages have been updated to use the new services:

- ✅ `Dashboard.jsx` - Uses walletService and transactionService
- ✅ `Balances.jsx` - Uses walletService with Bitcoin utilities
- ✅ `Invoices.jsx` - Uses invoiceService
- ✅ `AuthContext.jsx` - Uses walletService for wallet creation

## 🧪 Testing

Run the integration test:

```bash
cd bitnob
node test-integration.js
```

## 📖 Full Documentation

See `FRONTEND_INTEGRATION.md` for complete documentation including:
- Architecture overview
- Data flow diagrams
- Error handling
- Best practices
- Troubleshooting guide

## 💡 Examples

### Example: Create Invoice with Error Handling

```javascript
import invoiceService from '../services/invoice.service'
import toast from 'react-hot-toast'

async function createInvoice(formData) {
  try {
    const invoice = await invoiceService.createInvoice(formData)
    toast.success('Invoice created successfully!')
    return invoice
  } catch (error) {
    toast.error(error.message)
    console.error('Failed to create invoice:', error)
  }
}
```

### Example: Display Balance

```javascript
import walletService from '../services/wallet.service'
import { formatBTC, formatUSD } from '../lib/bitcoin'

function BalanceDisplay() {
  const [balance, setBalance] = useState(null)

  useEffect(() => {
    walletService.getBalance().then(setBalance)
  }, [])

  return (
    <div>
      <h3>{formatBTC(balance?.btcBalance)} BTC</h3>
      <p>${formatUSD(balance?.usdBalance)} USD</p>
    </div>
  )
}
```

## 🔐 Security Notes

- All services use the authenticated API client
- JWT tokens are automatically attached to requests
- Services handle 401 errors with automatic redirect to login
- All API calls are made to the backend, never directly to Bitnob

## 🎯 Next Steps

1. ✅ Services integrated
2. ✅ Bitcoin utilities added
3. ✅ Components updated
4. 🔲 Add payment gateway integration
5. 🔲 Implement PDF generation
6. 🔲 Add email notifications

## 📞 Support

For issues or questions, check:
1. `FRONTEND_INTEGRATION.md` - Full integration guide
2. `FEATURES.md` - Feature implementation status
3. Browser console for errors
4. Backend logs for API issues
